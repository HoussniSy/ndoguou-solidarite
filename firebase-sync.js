/* ===== FIREBASE SYNC — Cloud Database ===== */

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

/* Track local saves to prevent Firebase listener from overwriting */
let lastLocalSave = 0;
const SAVE_COOLDOWN = 3000; // ms to wait before accepting Firebase updates after a local save

/* ===== IMAGE COMPRESSION ===== */
function compressImg(base64) {
  return new Promise((resolve) => {
    if (!base64 || !base64.startsWith('data:image')) { resolve(base64); return; }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > 500) { h = (500 / w) * h; w = 500; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.4));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

/* Remove large base64 images from data for Firebase */
function cleanForFirebase(data) {
  const d = JSON.parse(JSON.stringify(data));
  if (d.activities && d.activities.cards) {
    d.activities.cards = d.activities.cards.map(c => ({
      ...c,
      img: (c.img && c.img.startsWith('data:image')) ? '' : (c.img || '')
    }));
  }
  return d;
}

/* ===== TOAST helper ===== */
function fbToast(msg) {
  if (typeof showAdminToast === 'function') showAdminToast(msg);
  else {
    const t = document.getElementById('toast');
    if (t) { t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
  }
}

/* ===== SYNC: Firebase → localStorage → UI ===== */

fbDB.ref('content').on('value', snap => {
  // Don't overwrite if we just saved locally
  if (Date.now() - lastLocalSave < SAVE_COOLDOWN) return;
  
  const data = snap.val();
  if (data) {
    localStorage.setItem('ndoguou_content', JSON.stringify(data));
    if (typeof applyContent === 'function') applyContent();
  }
});

fbDB.ref('gallery').on('value', snap => {
  if (Date.now() - lastLocalSave < SAVE_COOLDOWN) return;
  const data = snap.val();
  if (data !== null) {
    localStorage.setItem('ndoguou_gallery', JSON.stringify(data || []));
    if (typeof window.renderPublicGallery === 'function') window.renderPublicGallery();
    if (typeof renderAdminGallery === 'function') renderAdminGallery();
  }
});

fbDB.ref('adhesions').on('value', snap => {
  if (Date.now() - lastLocalSave < SAVE_COOLDOWN) return;
  const data = snap.val();
  if (data !== null) {
    localStorage.setItem('ndoguou_adhesions', JSON.stringify(data || []));
    if (typeof renderAdhesions === 'function') renderAdhesions();
  }
});

fbDB.ref('messages').on('value', snap => {
  if (Date.now() - lastLocalSave < SAVE_COOLDOWN) return;
  const data = snap.val();
  if (data !== null) {
    localStorage.setItem('ndoguou_messages', JSON.stringify(data || []));
    if (typeof renderMessages === 'function') renderMessages();
  }
});

fbDB.ref('admins').on('value', snap => {
  const data = snap.val();
  if (data) localStorage.setItem('ndoguou_admins', JSON.stringify(data));
});

/* ===== OVERRIDE SAVE METHODS ===== */

// CMS Content
const _cmsSave = CMS.save.bind(CMS);
CMS.save = function(data) {
  lastLocalSave = Date.now();
  _cmsSave(data);
  
  const cleaned = cleanForFirebase(data);
  fbDB.ref('content').set(cleaned).then(() => {
    console.log('✅ Firebase: contenu sauvegardé');
  }).catch(e => {
    console.error('❌ Firebase save error:', e);
    fbToast('⚠️ Erreur Firebase: ' + e.message);
  });
};

const _cmsReset = CMS.reset.bind(CMS);
CMS.reset = function() {
  lastLocalSave = Date.now();
  _cmsReset();
  fbDB.ref('content').remove().catch(e => console.error('Firebase reset error:', e));
};

// Gallery
const _galSave = GalleryStore.save.bind(GalleryStore);
GalleryStore.save = function(list) {
  lastLocalSave = Date.now();
  _galSave(list);
  
  // Compress all images before Firebase save
  Promise.all(list.map(async (item) => ({
    ...item,
    src: (item.src && item.src.startsWith('data:image')) ? await compressImg(item.src) : item.src
  }))).then(compressed => {
    return fbDB.ref('gallery').set(compressed);
  }).then(() => {
    console.log('✅ Firebase: galerie sauvegardée');
  }).catch(e => {
    console.error('❌ Firebase gallery error:', e);
    fbToast('⚠️ Erreur galerie Firebase: ' + e.message);
  });
};

const _galClear = GalleryStore.clear.bind(GalleryStore);
GalleryStore.clear = function() {
  lastLocalSave = Date.now();
  _galClear();
  fbDB.ref('gallery').set([]).catch(e => console.error('Firebase gallery clear error:', e));
};

// DB (Adhesions & Messages)
const _dbSet = DB._set.bind(DB);
DB._set = function(key, data) {
  lastLocalSave = Date.now();
  _dbSet(key, data);
  fbDB.ref(key).set(data).catch(e => console.error('Firebase DB error:', e));
};

// Admin Auth
const _adminSave = AdminAuth.saveAdmins.bind(AdminAuth);
AdminAuth.saveAdmins = function(admins) {
  _adminSave(admins);
  fbDB.ref('admins').set(admins).catch(e => console.error('Firebase admin error:', e));
};

/* ===== INITIAL MIGRATION ===== */
fbDB.ref('content').once('value').then(snap => {
  if (!snap.val()) {
    console.log('🔄 Migration initiale vers Firebase...');
    const content = CMS.get();
    const cleaned = cleanForFirebase(content);
    fbDB.ref('content').set(cleaned);
    
    const admins = AdminAuth.getAdmins();
    fbDB.ref('admins').set(admins);
    
    console.log('✅ Migration terminée');
  }
}).catch(e => {
  console.error('❌ Firebase non accessible:', e);
  fbToast('⚠️ Firebase non accessible — mode hors-ligne');
});

/* Test connection */
fbDB.ref('.info/connected').on('value', snap => {
  if (snap.val()) {
    console.log('☁️ Firebase connecté');
  } else {
    console.warn('⚠️ Firebase déconnecté');
  }
});
