/* ===== FIREBASE SYNC — Cloud Database ===== */
/* Ce fichier synchronise les données entre Firebase et localStorage.
   Il s'ajoute PAR-DESSUS le système existant (script.js/admin.js).
   Si Firebase est indisponible, le site fonctionne toujours avec le cache local. */

const firebaseConfig = {
  apiKey: "AIzaSyAY5SK8nnjCmg2DvRIr1n5AysCM4BpgFz0",
  authDomain: "ndoguou-solidarite.firebaseapp.com",
  databaseURL: "https://ndoguou-solidarite-default-rtdb.firebaseio.com",
  projectId: "ndoguou-solidarite",
  storageBucket: "ndoguou-solidarite.firebasestorage.app",
  messagingSenderId: "212758463312",
  appId: "1:212758463312:web:9ff5ca7bbeee311ca6a255",
  measurementId: "G-MC5267Q2HB"
};

firebase.initializeApp(firebaseConfig);
const fbDB = firebase.database();
let fbReady = false;

/* ===== IMAGE COMPRESSION ===== */
function compressImage(base64, maxWidth, quality) {
  maxWidth = maxWidth || 600;
  quality = quality || 0.5;
  return new Promise((resolve) => {
    if (!base64 || !base64.startsWith('data:image')) { resolve(base64); return; }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

/* Helper: strip base64 images from CMS content to reduce size for Firebase */
function prepareContentForFirebase(data) {
  const clone = JSON.parse(JSON.stringify(data));
  // Activity card images: compress if base64
  if (clone.activities && clone.activities.cards) {
    clone.activities.cards = clone.activities.cards.map(card => {
      // Keep non-base64 URLs as-is, skip base64 images (store separately)
      if (card.img && card.img.startsWith('data:image') && card.img.length > 50000) {
        // Store a placeholder, actual image goes to separate ref
        return { ...card, img: card.img.substring(0, 50000) + '...[truncated]' };
      }
      return card;
    });
  }
  return clone;
}

/* ===== SYNC: Firebase → localStorage → UI ===== */

// Content (CMS)
fbDB.ref('content').on('value', snap => {
  const data = snap.val();
  if (data) {
    // Merge activity images from separate storage if needed
    localStorage.setItem('ndoguou_content', JSON.stringify(data));
    if (typeof applyContent === 'function') applyContent();
    if (typeof loadCMSEditor === 'function' && document.getElementById('cmsEditor')) loadCMSEditor();
  }
  fbReady = true;
});

// Activity images (stored separately to avoid size issues)
fbDB.ref('activity_images').on('value', snap => {
  const imgs = snap.val();
  if (imgs) {
    // Merge into CMS content
    try {
      const content = JSON.parse(localStorage.getItem('ndoguou_content'));
      if (content && content.activities && content.activities.cards) {
        content.activities.cards.forEach((card, i) => {
          if (imgs[i]) card.img = imgs[i];
        });
        localStorage.setItem('ndoguou_content', JSON.stringify(content));
        if (typeof applyContent === 'function') applyContent();
      }
    } catch(e) {}
  }
});

// Gallery
fbDB.ref('gallery').on('value', snap => {
  const data = snap.val();
  if (data) {
    localStorage.setItem('ndoguou_gallery', JSON.stringify(data));
    if (typeof window.renderPublicGallery === 'function') window.renderPublicGallery();
    if (typeof renderAdminGallery === 'function') renderAdminGallery();
  }
});

// Adhesions
fbDB.ref('adhesions').on('value', snap => {
  const data = snap.val();
  if (data) {
    localStorage.setItem('ndoguou_adhesions', JSON.stringify(data));
    if (typeof renderAdhesions === 'function') renderAdhesions();
  }
});

// Messages
fbDB.ref('messages').on('value', snap => {
  const data = snap.val();
  if (data) {
    localStorage.setItem('ndoguou_messages', JSON.stringify(data));
    if (typeof renderMessages === 'function') renderMessages();
  }
});

// Admins
fbDB.ref('admins').on('value', snap => {
  const data = snap.val();
  if (data) {
    localStorage.setItem('ndoguou_admins', JSON.stringify(data));
  }
});

/* ===== OVERRIDE: Save → Firebase + localStorage ===== */

// CMS Content
const _cmsSave = CMS.save.bind(CMS);
CMS.save = function(data) {
  _cmsSave(data);
  try {
    // Save content to Firebase (without large base64 images)
    const safeData = JSON.parse(JSON.stringify(data));
    
    // Extract activity images separately
    const actImgs = {};
    if (safeData.activities && safeData.activities.cards) {
      safeData.activities.cards.forEach((card, i) => {
        if (card.img && card.img.startsWith('data:image')) {
          actImgs[i] = card.img;
          card.img = 'firebase://activity_images/' + i; // placeholder
        }
      });
    }
    
    fbDB.ref('content').set(safeData).then(() => {
      console.log('✅ Contenu sauvegardé dans Firebase');
    }).catch(e => {
      console.warn('Firebase CMS save error:', e);
    });
    
    // Save activity images separately
    if (Object.keys(actImgs).length > 0) {
      // Compress images before saving
      Promise.all(
        Object.entries(actImgs).map(async ([idx, img]) => {
          const compressed = await compressImage(img, 400, 0.4);
          return [idx, compressed];
        })
      ).then(results => {
        const compressed = {};
        results.forEach(([idx, img]) => { compressed[idx] = img; });
        fbDB.ref('activity_images').set(compressed).catch(e => {
          console.warn('Firebase activity images error:', e);
        });
      });
    }
  } catch(e) {
    console.warn('Firebase save error:', e);
  }
};

const _cmsReset = CMS.reset.bind(CMS);
CMS.reset = function() {
  _cmsReset();
  fbDB.ref('content').remove().catch(e => console.warn('Firebase reset error:', e));
  fbDB.ref('activity_images').remove().catch(e => {});
};

// Gallery Store
const _galSave = GalleryStore.save.bind(GalleryStore);
GalleryStore.save = function(list) {
  _galSave(list);
  // Compress gallery images before saving to Firebase
  Promise.all(list.map(async (item) => {
    if (item.src && item.src.startsWith('data:image')) {
      return { ...item, src: await compressImage(item.src, 400, 0.4) };
    }
    return item;
  })).then(compressed => {
    fbDB.ref('gallery').set(compressed).catch(e => console.warn('Firebase gallery error:', e));
  });
};

const _galClear = GalleryStore.clear.bind(GalleryStore);
GalleryStore.clear = function() {
  _galClear();
  fbDB.ref('gallery').remove().catch(e => {});
};

// DB (Adhesions & Messages) - fix: uses 'ndoguou_' prefix in localStorage
const _dbSet = DB._set.bind(DB);
DB._set = function(key, data) {
  _dbSet(key, data);
  // key is already without 'ndoguou_' prefix for Firebase
  fbDB.ref(key).set(data).catch(e => console.warn('Firebase DB save error:', e));
};

// Admin Auth
const _adminSave = AdminAuth.saveAdmins.bind(AdminAuth);
AdminAuth.saveAdmins = function(admins) {
  _adminSave(admins);
  fbDB.ref('admins').set(admins).catch(e => console.warn('Firebase admin save error:', e));
};

/* ===== INITIAL MIGRATION ===== */
async function migrateToFirebase() {
  try {
    const snap = await fbDB.ref('content').once('value');
    if (!snap.val()) {
      console.log('🔄 Migration initiale vers Firebase...');
      const content = CMS.get();
      
      // Separate activity images
      const actImgs = {};
      if (content.activities && content.activities.cards) {
        content.activities.cards.forEach((card, i) => {
          if (card.img && card.img.startsWith('data:image')) {
            actImgs[i] = card.img;
            card.img = 'firebase://activity_images/' + i;
          }
        });
      }
      
      await fbDB.ref('content').set(content);
      if (Object.keys(actImgs).length > 0) {
        const compressed = {};
        for (const [idx, img] of Object.entries(actImgs)) {
          compressed[idx] = await compressImage(img, 400, 0.4);
        }
        await fbDB.ref('activity_images').set(compressed);
      }
      
      const gallery = GalleryStore.get();
      if (gallery.length) {
        const compGal = await Promise.all(gallery.map(async (item) => {
          if (item.src && item.src.startsWith('data:image')) {
            return { ...item, src: await compressImage(item.src, 400, 0.4) };
          }
          return item;
        }));
        await fbDB.ref('gallery').set(compGal);
      }
      
      const adhesions = JSON.parse(localStorage.getItem('ndoguou_adhesions') || '[]');
      if (adhesions.length) await fbDB.ref('adhesions').set(adhesions);
      
      const messages = JSON.parse(localStorage.getItem('ndoguou_messages') || '[]');
      if (messages.length) await fbDB.ref('messages').set(messages);
      
      const admins = AdminAuth.getAdmins();
      await fbDB.ref('admins').set(admins);
      
      console.log('✅ Migration terminée !');
    }
  } catch(e) {
    console.warn('Migration error:', e);
  }
}
migrateToFirebase();

console.log('☁️ Firebase sync activé');
