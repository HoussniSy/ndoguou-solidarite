/* ===== NDOGUOU SOLIDARITÉ — Main Script + CMS ===== */

/* ----- Default Content (CMS) ----- */
const DEFAULT_CONTENT = {
  hero: {
    title: 'NDOGUOU',
    titleAccent: 'SOLIDARITÉ',
    tagline: 'Ensemble pour la culture, la solidarité et le partage. Rejoignez une communauté engagée pour un avenir meilleur.',
    btnPrimary: '✦ Rejoindre l\'association',
    btnSecondary: 'Découvrir nos activités →'
  },
  about: {
    badge: 'QUI SOMMES-NOUS',
    title: 'Notre mission & nos valeurs',
    subtitle: 'NDOGUOU SOLIDARITÉ œuvre pour promouvoir la culture, renforcer les liens communautaires et soutenir les plus vulnérables.',
    cards: [
      { icon: '🤝', title: 'Solidarité', text: 'Nous agissons ensemble pour soutenir les membres de notre communauté dans les moments importants de la vie.' },
      { icon: '🎭', title: 'Culture', text: 'Nous valorisons et transmettons notre patrimoine culturel à travers des événements, ateliers et célébrations.' },
      { icon: '📚', title: 'Éducation', text: 'Nous investissons dans l\'éducation et la formation pour donner à chacun les outils de sa réussite.' },
      { icon: '🌍', title: 'Communauté', text: 'Nous créons des espaces de rencontre et d\'échange pour renforcer les liens entre les générations.' }
    ]
  },
  activities: {
    badge: 'NOS ACTIVITÉS',
    title: 'Ce que nous faisons',
    subtitle: 'Découvrez nos programmes et événements qui renforcent la solidarité et célèbrent notre culture.',
    cards: [
      { tag: 'Culture', title: 'Événements culturels', text: 'Organisation de festivals, soirées culturelles et célébrations traditionnelles pour préserver et partager notre héritage.', img: 'assets/images/activity-culture.png' },
      { tag: 'Solidarité', title: 'Actions solidaires', text: 'Distribution de repas, aide aux familles en difficulté et soutien communautaire lors des moments importants.', img: 'assets/images/activity-solidarity.png' },
      { tag: 'Éducation', title: 'Ateliers éducatifs', text: 'Cours de langues, ateliers d\'art et programmes de mentorat pour la jeunesse de notre communauté.', img: 'assets/images/activity-education.png' }
    ]
  },
  partners: [
    { icon: '🏛️', name: 'Mairie locale', desc: 'Partenaire institutionnel' },
    { icon: '🎓', name: 'Université', desc: 'Partenaire éducatif' },
    { icon: '🏥', name: 'Centre de santé', desc: 'Partenaire santé' },
    { icon: '🤲', name: 'ONG Partenaires', desc: 'Réseau solidaire' }
  ],
  press: [
    { day: '15', month: 'Avr', title: 'NDOGUOU SOLIDARITÉ organise son festival culturel annuel', text: 'Un événement qui rassemble plus de 500 personnes pour célébrer la culture et la solidarité.' },
    { day: '02', month: 'Mar', title: 'Campagne de solidarité : 200 familles soutenues', text: 'L\'association a distribué des kits alimentaires à 200 familles dans le besoin.' },
    { day: '20', month: 'Jan', title: 'Lancement du programme éducatif pour la jeunesse', text: 'Un nouveau programme de mentorat et d\'ateliers culturels pour les jeunes de la communauté.' }
  ],
  galerie: {
    badge: 'GALERIE PHOTOS',
    title: 'Nos moments en images',
    subtitle: 'Revivez les temps forts de nos événements et activités à travers notre galerie.'
  },
  presseSection: {
    badge: 'PRESSE & PARTENAIRES',
    title: 'Ils nous font confiance',
    subtitle: 'Nos partenaires et les actualités qui parlent de notre engagement.'
  },
  contact: {
    badge: 'CONTACT',
    title: 'Contactez-nous',
    subtitle: 'Une question, une proposition ou envie de nous rejoindre ? N\'hésitez pas !',
    phone: '+222 34 58 88 01',
    email: 'contact@ndoguou-solidarite.org',
    address: 'Nouakchott, Mauritanie',
    hours: 'Lun - Ven : 9h00 - 18h00'
  },
  adhesion: {
    badge: 'ADHÉSION',
    sectionTitle: 'Rejoignez-nous',
    sectionSubtitle: 'Devenez membre de NDOGUOU SOLIDARITÉ et participez à notre mission culturelle et solidaire.',
    title: 'Pourquoi adhérer ?',
    text: 'En rejoignant NDOGUOU SOLIDARITÉ, vous contribuez directement à nos actions culturelles et solidaires tout en bénéficiant d\'avantages exclusifs.',
    benefits: ['Accès prioritaire à tous nos événements','Participation aux assemblées générales','Réseau de solidarité communautaire','Newsletter et actualités exclusives','Certificat de membre officiel','Réductions partenaires']
  },
  footer: { description: 'Association culturelle dédiée à la solidarité, la promotion culturelle et le renforcement des liens communautaires. Ensemble, construisons un avenir meilleur.' }
};

/* ----- CMS ----- */
const CMS = {
  _key: 'ndoguou_content',
  get() {
    try {
      const saved = JSON.parse(localStorage.getItem(this._key));
      if (!saved || Object.keys(saved).length === 0) return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
      // Only fill missing TOP-LEVEL keys from defaults (don't deep-merge arrays)
      for (const key of Object.keys(DEFAULT_CONTENT)) {
        if (!(key in saved)) saved[key] = JSON.parse(JSON.stringify(DEFAULT_CONTENT[key]));
      }
      // Ensure arrays exist (Firebase drops empty arrays)
      if (saved.activities && !Array.isArray(saved.activities.cards)) saved.activities.cards = [];
      if (saved.about && !Array.isArray(saved.about.cards)) saved.about.cards = [];
      if (!Array.isArray(saved.partners)) saved.partners = [];
      if (!Array.isArray(saved.press)) saved.press = [];
      if (saved.adhesion && !Array.isArray(saved.adhesion.benefits)) saved.adhesion.benefits = [];
      return saved;
    } catch { return JSON.parse(JSON.stringify(DEFAULT_CONTENT)); }
  },
  save(data) { localStorage.setItem(this._key, JSON.stringify(data)); },
  reset() { localStorage.removeItem(this._key); }
};

/* ----- Gallery Store (admin only) ----- */
const GalleryStore = {
  _key: 'ndoguou_gallery',
  get() { try { return JSON.parse(localStorage.getItem(this._key)) || []; } catch { return []; } },
  save(list) { localStorage.setItem(this._key, JSON.stringify(list)); },
  add(src, title) { const list = this.get(); list.push({src, title, id: Date.now()}); this.save(list); },
  remove(id) { this.save(this.get().filter(img => img.id != id)); },
  clear() { localStorage.removeItem(this._key); }
};

/* ----- Multi-Admin System ----- */
const AdminAuth = {
  _key: 'ndoguou_admins',
  defaults: [
    { username: 'admin1', password: 'Rozay/dieng2026', name: 'Administrateur 1' },
    { username: 'admin2', password: 'ndoguou2026', name: 'Administrateur 2' }
  ],
  getAdmins() {
    try { const saved = JSON.parse(localStorage.getItem(this._key)); return saved && saved.length ? saved : this.defaults; }
    catch { return this.defaults; }
  },
  saveAdmins(admins) { localStorage.setItem(this._key, JSON.stringify(admins)); },
  login(username, password) {
    const admin = this.getAdmins().find(a => a.username === username && a.password === password);
    if (admin) { sessionStorage.setItem('ndoguou_logged', admin.username); sessionStorage.setItem('ndoguou_admin_name', admin.name); }
    return admin;
  },
  isLogged() { return !!sessionStorage.getItem('ndoguou_logged'); },
  currentName() { return sessionStorage.getItem('ndoguou_admin_name') || 'Admin'; },
  logout() { sessionStorage.removeItem('ndoguou_logged'); sessionStorage.removeItem('ndoguou_admin_name'); },
  changePassword(username, newPass) {
    const admins = this.getAdmins();
    const admin = admins.find(a => a.username === username);
    if (admin) { admin.password = newPass; this.saveAdmins(admins); return true; }
    return false;
  },
  changeName(username, newName) {
    const admins = this.getAdmins();
    const admin = admins.find(a => a.username === username);
    if (admin) { admin.name = newName; this.saveAdmins(admins); return true; }
    return false;
  }
};

/* ----- Database ----- */
const DB = {
  _get(key) { try { return JSON.parse(localStorage.getItem('ndoguou_'+key))||[]; } catch { return []; } },
  _set(key, data) { localStorage.setItem('ndoguou_'+key, JSON.stringify(data)); },
  addAdhesion(e) { const l=this._get('adhesions'); e.id=Date.now(); e.date=new Date().toLocaleString('fr-FR'); e.status='En attente'; l.unshift(e); this._set('adhesions',l); },
  getAdhesions() { return this._get('adhesions'); },
  updateAdhesionStatus(id,s) { const l=this._get('adhesions'); const i=l.find(a=>a.id===id); if(i){i.status=s; this._set('adhesions',l);} },
  deleteAdhesion(id) { this._set('adhesions',this._get('adhesions').filter(a=>a.id!==id)); },
  addMessage(e) { const l=this._get('messages'); e.id=Date.now(); e.date=new Date().toLocaleString('fr-FR'); e.lu=false; l.unshift(e); this._set('messages',l); },
  getMessages() { return this._get('messages'); },
  markAsRead(id) { const l=this._get('messages'); const i=l.find(m=>m.id===id); if(i){i.lu=true; this._set('messages',l);} },
  deleteMessage(id) { this._set('messages',this._get('messages').filter(m=>m.id!==id)); },
  getStats() { return { adhesions:this._get('adhesions').length, messages:this._get('messages').length, messagesNonLus:this._get('messages').filter(m=>!m.lu).length, adhesionsEnAttente:this._get('adhesions').filter(a=>a.status==='En attente').length }; },
  exportJSON(key) { const d=this._get(key); const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`ndoguou_${key}_${new Date().toISOString().slice(0,10)}.json`; a.click(); }
};

/* ----- Apply Content ----- */
function applyContent() {
  const c = CMS.get();
  const el = id => document.getElementById(id);

  if(el('heroTitle')) el('heroTitle').innerHTML = `<span class="accent">${c.hero.title}</span> ${c.hero.titleAccent}`;
  if(el('heroTagline')) el('heroTagline').textContent = c.hero.tagline;
  if(el('heroBtnPrimary')) el('heroBtnPrimary').textContent = c.hero.btnPrimary;
  if(el('heroBtnSecondary')) el('heroBtnSecondary').textContent = c.hero.btnSecondary;

  if(el('aboutBadge')) el('aboutBadge').textContent = c.about.badge;
  if(el('aboutTitle')) el('aboutTitle').textContent = c.about.title;
  if(el('aboutSubtitle')) el('aboutSubtitle').textContent = c.about.subtitle;
  if(el('aboutGrid')) el('aboutGrid').innerHTML = c.about.cards.map(card => `<div class="about-card fade-in visible"><div class="icon">${card.icon}</div><h3>${card.title}</h3><p>${card.text}</p></div>`).join('');

  if(el('actBadge')) el('actBadge').textContent = c.activities.badge;
  if(el('actTitle')) el('actTitle').textContent = c.activities.title;
  if(el('actSubtitle')) el('actSubtitle').textContent = c.activities.subtitle;
  if(el('actGrid')) el('actGrid').innerHTML = c.activities.cards.map(card => `<div class="activity-card fade-in visible"><div class="activity-img"><img src="${card.img}" alt="${card.title}" /></div><div class="activity-body"><span class="activity-tag">${card.tag}</span><h3>${card.title}</h3><p>${card.text}</p></div></div>`).join('');

  if(el('galerieBadge')) el('galerieBadge').textContent = c.galerie.badge;
  if(el('galerieTitle')) el('galerieTitle').textContent = c.galerie.title;
  if(el('galerieSubtitle')) el('galerieSubtitle').textContent = c.galerie.subtitle;

  if(el('presseBadge')) el('presseBadge').textContent = c.presseSection.badge;
  if(el('presseTitle')) el('presseTitle').textContent = c.presseSection.title;
  if(el('presseSubtitle')) el('presseSubtitle').textContent = c.presseSection.subtitle;
  if(el('partnersGrid')) el('partnersGrid').innerHTML = c.partners.map(p => `<div class="partner-card"><div class="partner-icon">${p.icon}</div><h4>${p.name}</h4><p>${p.desc}</p></div>`).join('');
  if(el('pressList')) el('pressList').innerHTML = c.press.map(p => `<div class="press-item"><div class="press-date"><span class="day">${p.day}</span><span class="month">${p.month}</span></div><div class="press-info"><h4>${p.title}</h4><p>${p.text}</p></div></div>`).join('');

  if(el('contactBadge')) el('contactBadge').textContent = c.contact.badge;
  if(el('contactTitle')) el('contactTitle').textContent = c.contact.title;
  if(el('contactSubtitle')) el('contactSubtitle').textContent = c.contact.subtitle;
  if(el('ctPhone')) el('ctPhone').textContent = c.contact.phone;
  if(el('ctEmail2')) el('ctEmail2').textContent = c.contact.email;
  if(el('ctAddress')) el('ctAddress').textContent = c.contact.address;
  if(el('ctHours')) el('ctHours').textContent = c.contact.hours;

  if(el('adhBadge')) el('adhBadge').textContent = c.adhesion.badge;
  if(el('adhSectionTitle')) el('adhSectionTitle').textContent = c.adhesion.sectionTitle;
  if(el('adhSectionSubtitle')) el('adhSectionSubtitle').textContent = c.adhesion.sectionSubtitle;
  if(el('adhInfoTitle')) el('adhInfoTitle').textContent = c.adhesion.title;
  if(el('adhInfoText')) el('adhInfoText').textContent = c.adhesion.text;
  if(el('adhBenefits')) el('adhBenefits').innerHTML = c.adhesion.benefits.map(b=>`<li>${b}</li>`).join('');

  if(el('footerDesc')) el('footerDesc').textContent = c.footer.description;
  if(el('footerPhone')) el('footerPhone').textContent = '📞 ' + c.contact.phone;
  if(el('footerEmail')) el('footerEmail').textContent = '✉️ ' + c.contact.email;
  if(el('footerAddress')) el('footerAddress').textContent = '📍 ' + c.contact.address;
}

/* ----- Main App ----- */
document.addEventListener('DOMContentLoaded', () => {
  applyContent();

  /* Navbar */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    if(navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
    let cur = ''; sections.forEach(s => { if (window.scrollY >= s.offsetTop-120) cur = s.getAttribute('id'); });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+cur));
  });

  /* Mobile menu */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navLinks');
  if(navToggle) {
    navToggle.addEventListener('click', () => { navToggle.classList.toggle('open'); navMenu.classList.toggle('open'); });
    navLinks.forEach(l => l.addEventListener('click', () => { navToggle.classList.remove('open'); navMenu.classList.remove('open'); }));
  }

  /* Scroll reveal */
  const obs = new IntersectionObserver(entries => { entries.forEach((e,i) => { if(e.isIntersecting){setTimeout(()=>e.target.classList.add('visible'),i*100); obs.unobserve(e.target);} }); }, {threshold:0.15});
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

  /* Gallery — admin-uploaded images only */
  const galleryGrid = document.getElementById('galleryGrid');

  function renderGallery() {
    if(!galleryGrid) return;
    const images = GalleryStore.get();
    if (!images.length) {
      galleryGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-light);padding:40px 0;">📷 Photos à venir — restez connectés !</p>';
      return;
    }
    galleryGrid.innerHTML = '';
    images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-item fade-in visible';
      item.innerHTML = `<img src="${img.src}" alt="${img.title}" loading="lazy" />`;
      item.addEventListener('click', () => openLightbox(idx, images));
      galleryGrid.appendChild(item);
    });
  }
  renderGallery();
  window.renderPublicGallery = renderGallery;

  /* Lightbox */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  let currentLB = 0, lbImages = [];
  function openLightbox(idx, images) { currentLB=idx; lbImages=images; lightboxImg.src=images[idx].src; lightbox.classList.add('active'); document.body.style.overflow='hidden'; }
  function closeLightbox() { lightbox.classList.remove('active'); document.body.style.overflow=''; }
  if(document.getElementById('lightboxClose')) {
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if(e.target===lightbox) closeLightbox(); });
    document.getElementById('lightboxPrev').addEventListener('click', e => { e.stopPropagation(); currentLB=(currentLB-1+lbImages.length)%lbImages.length; lightboxImg.src=lbImages[currentLB].src; });
    document.getElementById('lightboxNext').addEventListener('click', e => { e.stopPropagation(); currentLB=(currentLB+1)%lbImages.length; lightboxImg.src=lbImages[currentLB].src; });
    document.addEventListener('keydown', e => { if(!lightbox.classList.contains('active')) return; if(e.key==='Escape') closeLightbox(); if(e.key==='ArrowLeft') document.getElementById('lightboxPrev').click(); if(e.key==='ArrowRight') document.getElementById('lightboxNext').click(); });
  }

  /* QR Code */
  const qr = document.getElementById('qrCanvas');
  if(qr && typeof QRCode!=='undefined') {
    const url = window.location.hostname.includes('github.io') ? window.location.origin+window.location.pathname : 'https://houssnisy.github.io/ndoguou-solidarite/';
    new QRCode(qr, {text:url, width:200, height:200, colorDark:'#2C2419', colorLight:'#FFFFFF', correctLevel:QRCode.CorrectLevel.H});
  }

  /* Forms */
  const adhForm = document.getElementById('adhesionForm');
  const ctForm = document.getElementById('contactForm');
  if(adhForm) adhForm.addEventListener('submit', e => { e.preventDefault(); DB.addAdhesion({nom:document.getElementById('adhNom').value, prenom:document.getElementById('adhPrenom').value, email:document.getElementById('adhEmail').value, telephone:document.getElementById('adhTel').value, type:document.getElementById('adhType').value, motivation:document.getElementById('adhMessage').value}); showToast('✅ Demande d\'adhésion enregistrée !'); adhForm.reset(); });
  if(ctForm) ctForm.addEventListener('submit', e => { e.preventDefault(); DB.addMessage({nom:document.getElementById('ctNom').value, email:document.getElementById('ctEmailField').value, sujet:document.getElementById('ctSujet').value, message:document.getElementById('ctMessage').value}); showToast('✅ Message envoyé !'); ctForm.reset(); });

  /* Toast */
  const toast = document.getElementById('toast'); let tt;
  function showToast(m) { if(!toast)return; toast.textContent=m; toast.classList.add('show'); clearTimeout(tt); tt=setTimeout(()=>toast.classList.remove('show'),3500); }
  window.showToast = showToast;
});

/* QR Code Download — generates a branded PNG */
function downloadQR() {
  const qrCanvas = document.querySelector('#qrCanvas canvas');
  if (!qrCanvas) { window.showToast('⏳ QR code en cours de génération...'); return; }

  // Create a branded image with logo + QR + text
  const canvas = document.createElement('canvas');
  const size = 600;
  canvas.width = size;
  canvas.height = size + 120;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.roundRect(0, 0, canvas.width, canvas.height, 24);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#D32F2F';
  ctx.lineWidth = 4;
  ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 20);
  ctx.stroke();

  // QR Code centered
  const qrSize = 400;
  const qrX = (size - qrSize) / 2;
  ctx.drawImage(qrCanvas, qrX, 60, qrSize, qrSize);

  // Title
  ctx.fillStyle = '#2C2419';
  ctx.font = 'bold 32px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NDOGUOU SOLIDARITÉ', size / 2, 510);

  // URL
  ctx.fillStyle = '#8B7355';
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText('houssnisy.github.io/ndoguou-solidarite', size / 2, 545);

  // Instruction
  ctx.fillStyle = '#D32F2F';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText('📱 Scannez pour accéder au site', size / 2, 40);

  // Footer
  ctx.fillStyle = '#999';
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText('Association Culturelle • Nouakchott, Mauritanie', size / 2, canvas.height - 30);

  // Download
  const link = document.createElement('a');
  link.download = 'NDOGUOU_SOLIDARITE_QR_Code.png';
  link.href = canvas.toDataURL('image/png');
  link.click();

  window.showToast('✅ QR Code téléchargé ! Partagez-le librement.');
}

/* QR Code Share — uses Web Share API or clipboard */
async function shareQR() {
  const siteUrl = 'https://houssnisy.github.io/ndoguou-solidarite/';

  // Try Web Share API (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'NDOGUOU SOLIDARITÉ',
        text: 'Découvrez NDOGUOU SOLIDARITÉ — Association culturelle. Scannez ou cliquez pour accéder au site :',
        url: siteUrl
      });
      window.showToast('✅ Lien partagé !');
    } catch (e) { /* user cancelled */ }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(siteUrl);
      window.showToast('📋 Lien copié ! Collez-le dans WhatsApp, SMS, etc.');
    } catch {
      // Ultra fallback
      prompt('Copiez ce lien :', siteUrl);
    }
  }
}
