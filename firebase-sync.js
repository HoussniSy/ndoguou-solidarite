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

/* ===== IMAGE COMPRESSION ===== */
function compressImage(base64, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    if (!base64.startsWith('data:image')) { resolve(base64); return; }
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

/* ===== SYNC: Firebase → localStorage → UI ===== */

// Content (CMS)
fbDB.ref('content').on('value', snap => {
  const data = snap.val();
  if (data) {
    localStorage.setItem('ndoguou_content', JSON.stringify(data));
    if (typeof applyContent === 'function') applyContent();
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
  fbDB.ref('content').set(data).catch(e => console.warn('Firebase CMS save error:', e));
};

const _cmsReset = CMS.reset.bind(CMS);
CMS.reset = function() {
  _cmsReset();
  fbDB.ref('content').remove().catch(e => console.warn('Firebase CMS reset error:', e));
};

// Gallery Store
const _galSave = GalleryStore.save.bind(GalleryStore);
GalleryStore.save = function(list) {
  _galSave(list);
  fbDB.ref('gallery').set(list).catch(e => console.warn('Firebase gallery save error:', e));
};

// Override add to compress images before saving
const _galAdd = GalleryStore.add.bind(GalleryStore);
GalleryStore.add = async function(src, title) {
  const compressed = await compressImage(src);
  const list = this.get();
  list.push({ src: compressed, title, id: Date.now() });
  this.save(list);
};

const _galClear = GalleryStore.clear.bind(GalleryStore);
GalleryStore.clear = function() {
  _galClear();
  fbDB.ref('gallery').remove().catch(e => console.warn('Firebase gallery clear error:', e));
};

// DB (Adhesions & Messages)
const _dbSet = DB._set.bind(DB);
DB._set = function(key, data) {
  _dbSet(key, data);
  fbDB.ref(key).set(data).catch(e => console.warn('Firebase DB save error:', e));
};

// Admin Auth
const _adminSave = AdminAuth.saveAdmins.bind(AdminAuth);
AdminAuth.saveAdmins = function(admins) {
  _adminSave(admins);
  fbDB.ref('admins').set(admins).catch(e => console.warn('Firebase admin save error:', e));
};

/* ===== INITIAL MIGRATION ===== */
/* If Firebase is empty but localStorage has data, push it up (one-time) */
async function migrateToFirebase() {
  const snap = await fbDB.ref('content').once('value');
  if (!snap.val()) {
    console.log('🔄 Migration vers Firebase...');
    const content = CMS.get();
    fbDB.ref('content').set(content);
    
    const gallery = GalleryStore.get();
    if (gallery.length) fbDB.ref('gallery').set(gallery);
    
    const adhesions = JSON.parse(localStorage.getItem('ndoguou_adhesions') || '[]');
    if (adhesions.length) fbDB.ref('adhesions').set(adhesions);
    
    const messages = JSON.parse(localStorage.getItem('ndoguou_messages') || '[]');
    if (messages.length) fbDB.ref('messages').set(messages);
    
    const admins = AdminAuth.getAdmins();
    fbDB.ref('admins').set(admins);
    
    console.log('✅ Migration terminée !');
  }
}
migrateToFirebase();

console.log('☁️ Firebase sync activé — les données sont partagées en temps réel');
