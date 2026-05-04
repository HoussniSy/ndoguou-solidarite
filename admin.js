/* ===== Admin Panel Logic ===== */

/* Password show/hide toggle */
function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁️'; }
}

/* Login with multi-admin */
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;
  const admin = AdminAuth.login(user, pass);
  if (admin) { showAdmin(); }
  else { showAdminToast('❌ Identifiants incorrects'); }
});
if (AdminAuth.isLogged()) showAdmin();

function showAdmin() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'flex';
  document.querySelector('.admin-user span').textContent = AdminAuth.currentName();
  document.querySelector('.avatar').textContent = AdminAuth.currentName().charAt(0).toUpperCase();
  renderAll(); loadCMSEditor(); renderAdminGallery();
}
document.getElementById('logoutBtn').addEventListener('click', () => { AdminAuth.logout(); location.reload(); });

/* Tabs */
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + link.dataset.tab).classList.add('active');
    document.getElementById('pageTitle').textContent = link.textContent.trim();
  });
});

/* Stats & Data */
function renderAll() {
  const s = DB.getStats();
  document.getElementById('statAdhesions').textContent = s.adhesions;
  document.getElementById('statPending').textContent = s.adhesionsEnAttente;
  document.getElementById('statMessages').textContent = s.messages;
  document.getElementById('statUnread').textContent = s.messagesNonLus;
  renderAdhesions(); renderMessages(); renderRecent();
}

function renderAdhesions() {
  const filter = document.getElementById('adhFilter').value;
  const search = (document.getElementById('adhSearch').value||'').toLowerCase();
  let list = DB.getAdhesions();
  if (filter!=='all') list = list.filter(a => a.status===filter);
  if (search) list = list.filter(a => (a.nom+a.prenom+a.email+a.telephone).toLowerCase().includes(search));
  document.getElementById('adhCount').textContent = list.length;
  const tbody = document.getElementById('adhBody'), empty = document.getElementById('adhEmpty'), wrap = document.querySelector('.data-table-wrapper');
  if (!list.length) { tbody.innerHTML=''; empty.style.display='block'; if(wrap)wrap.style.display='none'; return; }
  empty.style.display='none'; if(wrap)wrap.style.display='block';
  tbody.innerHTML = list.map(a => `<tr><td>${a.date}</td><td><strong>${a.nom}</strong></td><td>${a.prenom}</td><td><a href="mailto:${a.email}">${a.email}</a></td><td>${a.telephone}</td><td><span class="tag">${a.type}</span></td><td><span class="status status-${a.status.replace(/\s/g,'').toLowerCase()}">${a.status}</span></td><td class="actions-cell"><button class="action-btn approve" onclick="updateAdh(${a.id},'Approuvé')">✓</button><button class="action-btn reject" onclick="updateAdh(${a.id},'Refusé')">✗</button><button class="action-btn delete" onclick="deleteAdh(${a.id})">🗑</button></td></tr>`).join('');
}
function updateAdh(id,s){DB.updateAdhesionStatus(id,s);renderAll();showAdminToast('Adhésion '+s.toLowerCase());}
function deleteAdh(id){if(!confirm('Supprimer ?'))return;DB.deleteAdhesion(id);renderAll();}

function renderMessages() {
  const filter=document.getElementById('msgFilter').value, search=(document.getElementById('msgSearch').value||'').toLowerCase();
  let list=DB.getMessages();
  if(filter==='unread')list=list.filter(m=>!m.lu); if(filter==='read')list=list.filter(m=>m.lu);
  if(search)list=list.filter(m=>(m.nom+m.email+m.sujet+m.message).toLowerCase().includes(search));
  document.getElementById('msgCount').textContent=list.length;
  const c=document.getElementById('messagesList'),e=document.getElementById('msgEmpty');
  if(!list.length){c.innerHTML='';e.style.display='block';return;} e.style.display='none';
  c.innerHTML=list.map(m=>`<div class="message-card ${m.lu?'read':'unread'}"><div class="msg-header"><div class="msg-sender"><strong>${m.nom}</strong> <a href="mailto:${m.email}">${m.email}</a></div><span class="msg-date">${m.date}</span></div><div class="msg-subject">${m.sujet}</div><div class="msg-body">${m.message}</div><div class="msg-actions">${!m.lu?`<button class="btn btn-brown" onclick="markRead(${m.id})">✓ Lu</button>`:'<span class="read-badge">✓ Lu</span>'}<button class="action-btn delete" onclick="deleteMsg(${m.id})">🗑</button></div></div>`).join('');
}
function markRead(id){DB.markAsRead(id);renderAll();}
function deleteMsg(id){if(!confirm('Supprimer ?'))return;DB.deleteMessage(id);renderAll();}

function renderRecent() {
  const a=DB.getAdhesions().slice(0,5),m=DB.getMessages().slice(0,5);
  document.getElementById('recentAdhesions').innerHTML=a.length?a.map(x=>`<div class="recent-item"><div><strong>${x.prenom} ${x.nom}</strong> — <span class="tag">${x.type}</span></div><span class="status status-${x.status.replace(/\s/g,'').toLowerCase()}">${x.status}</span></div>`).join(''):'<p class="empty-text">Aucune</p>';
  document.getElementById('recentMessages').innerHTML=m.length?m.map(x=>`<div class="recent-item ${x.lu?'':'unread'}"><div><strong>${x.nom}</strong> — ${x.sujet}</div><span class="msg-date">${x.date}</span></div>`).join(''):'<p class="empty-text">Aucun</p>';
}

function exportCSV(type){const d=type==='adhesions'?DB.getAdhesions():DB.getMessages();if(!d.length){showAdminToast('Aucune donnée');return;}const h=Object.keys(d[0]);const csv=[h.join(';'),...d.map(r=>h.map(k=>'"'+(r[k]||'')+'"').join(';'))].join('\n');const b=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`ndoguou_${type}_${new Date().toISOString().slice(0,10)}.csv`;a.click();showAdminToast('✅ CSV exporté');}

function showAdminToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}

/* ===== GALLERY ADMIN ===== */
function renderAdminGallery() {
  const container = document.getElementById('adminGalleryGrid');
  if (!container) return;
  const images = GalleryStore.get();
  if (!images.length) {
    container.innerHTML = '<p class="empty-text">Aucune image ajoutée. Utilisez le bouton ci-dessous pour ajouter des photos.</p>';
    return;
  }
  container.innerHTML = images.map(img => `
    <div class="admin-gallery-item">
      <img src="${img.src}" alt="${img.title}" />
      <div class="admin-gallery-overlay">
        <span>${img.title}</span>
        <button class="action-btn delete" onclick="removeGalleryImage(${img.id})">🗑</button>
      </div>
    </div>
  `).join('');
}

function removeGalleryImage(id) {
  GalleryStore.remove(id);
  renderAdminGallery();
  showAdminToast('✅ Image supprimée');
}

/* Gallery upload handler */
function setupGalleryUpload() {
  const input = document.getElementById('adminGalleryInput');
  const zone = document.getElementById('adminGalleryUpload');
  if (!input || !zone) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--red)'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', e => { e.preventDefault(); zone.style.borderColor = ''; processFiles(e.dataTransfer.files); });
  input.addEventListener('change', e => processFiles(e.target.files));

  function processFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const title = file.name.replace(/\.[^.]+$/, '');
        GalleryStore.add(e.target.result, title);
        renderAdminGallery();
        showAdminToast('📸 Image ajoutée à la galerie !');
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }
}
document.addEventListener('DOMContentLoaded', setupGalleryUpload);

/* ===== CMS EDITOR ===== */
function esc(s){return String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');}

function loadCMSEditor() {
  const c = CMS.get();
  const editor = document.getElementById('cmsEditor');
  if (!editor) return;
  editor.innerHTML = `
  <div class="cms-section"><h3>🏠 Accueil (Hero)</h3><div class="cms-fields">
    <div class="form-group"><label>Titre</label><input type="text" id="cms_hero_title" value="${esc(c.hero.title)}" /></div>
    <div class="form-group"><label>Sous-titre</label><input type="text" id="cms_hero_titleAccent" value="${esc(c.hero.titleAccent)}" /></div>
    <div class="form-group"><label>Slogan</label><textarea id="cms_hero_tagline" rows="2">${esc(c.hero.tagline)}</textarea></div>
    <div class="form-row"><div class="form-group"><label>Bouton 1</label><input type="text" id="cms_hero_btnPrimary" value="${esc(c.hero.btnPrimary)}" /></div>
    <div class="form-group"><label>Bouton 2</label><input type="text" id="cms_hero_btnSecondary" value="${esc(c.hero.btnSecondary)}" /></div></div>
  </div></div>

  <div class="cms-section"><h3>💡 Qui sommes-nous</h3><div class="cms-fields">
    <div class="form-row"><div class="form-group"><label>Badge</label><input type="text" id="cms_about_badge" value="${esc(c.about.badge)}" /></div>
    <div class="form-group"><label>Titre</label><input type="text" id="cms_about_title" value="${esc(c.about.title)}" /></div></div>
    <div class="form-group"><label>Sous-titre</label><textarea id="cms_about_subtitle" rows="2">${esc(c.about.subtitle)}</textarea></div>
    <h4 style="margin:12px 0 6px;">Cartes de valeurs</h4>
    <div id="cms_about_cards">${c.about.cards.map((x,i)=>`<div class="cms-card-row"><input placeholder="Emoji" value="${esc(x.icon)}" data-field="about_card_icon_${i}" style="width:60px;text-align:center;"/><input placeholder="Titre" value="${esc(x.title)}" data-field="about_card_title_${i}"/><input placeholder="Description" value="${esc(x.text)}" data-field="about_card_text_${i}" style="flex:2;"/><button class="action-btn delete" onclick="removeCMSCard('about',${i})">✗</button></div>`).join('')}</div>
    <button class="btn btn-brown" style="margin-top:6px;" onclick="addCMSCard('about')">+ Carte</button>
  </div></div>

  <div class="cms-section"><h3>🎭 Activités</h3><div class="cms-fields">
    <div class="form-row"><div class="form-group"><label>Badge</label><input type="text" id="cms_act_badge" value="${esc(c.activities.badge)}" /></div>
    <div class="form-group"><label>Titre</label><input type="text" id="cms_act_title" value="${esc(c.activities.title)}" /></div></div>
    <div class="form-group"><label>Sous-titre</label><textarea id="cms_act_subtitle" rows="2">${esc(c.activities.subtitle)}</textarea></div>
    <div id="cms_act_cards">${c.activities.cards.map((x,i)=>`<div class="cms-act-card">
      <div class="cms-act-img"><img src="${esc(x.img)}" id="act_img_preview_${i}" /><label class="cms-img-btn">📷 Changer<input type="file" accept="image/*" onchange="previewActImg(${i},this)" style="display:none;"/></label><input type="hidden" id="act_img_val_${i}" value="${esc(x.img)}" /></div>
      <div class="cms-act-fields"><input placeholder="Tag" value="${esc(x.tag)}" data-field="act_card_tag_${i}"/><input placeholder="Titre" value="${esc(x.title)}" data-field="act_card_title_${i}"/><textarea placeholder="Description" data-field="act_card_text_${i}" rows="2">${esc(x.text)}</textarea></div>
      <button class="action-btn delete" onclick="removeCMSCard('act',${i})" style="align-self:flex-start;margin-top:8px;">✗</button>
    </div>`).join('')}</div>
    <button class="btn btn-brown" style="margin-top:6px;" onclick="addCMSCard('act')">+ Activité</button>
  </div></div>

  <div class="cms-section"><h3>📷 Section Galerie</h3><div class="cms-fields">
    <div class="form-row"><div class="form-group"><label>Badge</label><input type="text" id="cms_galerie_badge" value="${esc(c.galerie.badge)}" /></div>
    <div class="form-group"><label>Titre</label><input type="text" id="cms_galerie_title" value="${esc(c.galerie.title)}" /></div></div>
    <div class="form-group"><label>Sous-titre</label><textarea id="cms_galerie_subtitle" rows="2">${esc(c.galerie.subtitle)}</textarea></div>
  </div></div>

  <div class="cms-section"><h3>📰 Section Presse & Partenaires</h3><div class="cms-fields">
    <div class="form-row"><div class="form-group"><label>Badge</label><input type="text" id="cms_presse_badge" value="${esc(c.presseSection.badge)}" /></div>
    <div class="form-group"><label>Titre</label><input type="text" id="cms_presse_title" value="${esc(c.presseSection.title)}" /></div></div>
    <div class="form-group"><label>Sous-titre</label><textarea id="cms_presse_subtitle" rows="2">${esc(c.presseSection.subtitle)}</textarea></div>
    <h4 style="margin:16px 0 6px;">Partenaires</h4>
    <div id="cms_partners">${c.partners.map((x,i)=>`<div class="cms-card-row"><input placeholder="Emoji" value="${esc(x.icon)}" data-field="partner_icon_${i}" style="width:60px;text-align:center;"/><input placeholder="Nom" value="${esc(x.name)}" data-field="partner_name_${i}"/><input placeholder="Desc" value="${esc(x.desc)}" data-field="partner_desc_${i}" style="flex:2;"/><button class="action-btn delete" onclick="removeCMSCard('partner',${i})">✗</button></div>`).join('')}</div>
    <button class="btn btn-brown" style="margin-top:6px;" onclick="addCMSCard('partner')">+ Partenaire</button>
    <h4 style="margin:16px 0 6px;">Articles de presse</h4>
    <div id="cms_press">${c.press.map((x,i)=>`<div class="cms-card-row"><input placeholder="Jour" value="${esc(x.day)}" data-field="press_day_${i}" style="width:50px;text-align:center;"/><input placeholder="Mois" value="${esc(x.month)}" data-field="press_month_${i}" style="width:55px;"/><input placeholder="Titre" value="${esc(x.title)}" data-field="press_title_${i}"/><input placeholder="Desc" value="${esc(x.text)}" data-field="press_text_${i}" style="flex:2;"/><button class="action-btn delete" onclick="removeCMSCard('press',${i})">✗</button></div>`).join('')}</div>
    <button class="btn btn-brown" style="margin-top:6px;" onclick="addCMSCard('press')">+ Article</button>
  </div></div>

  <div class="cms-section"><h3>📝 Section Adhésion</h3><div class="cms-fields">
    <div class="form-row"><div class="form-group"><label>Badge</label><input type="text" id="cms_adh_badge" value="${esc(c.adhesion.badge)}" /></div>
    <div class="form-group"><label>Titre de section</label><input type="text" id="cms_adh_sectionTitle" value="${esc(c.adhesion.sectionTitle)}" /></div></div>
    <div class="form-group"><label>Sous-titre de section</label><textarea id="cms_adh_sectionSubtitle" rows="2">${esc(c.adhesion.sectionSubtitle)}</textarea></div>
    <h4 style="margin:16px 0 6px;">Encart « Pourquoi adhérer ? »</h4>
    <div class="form-group"><label>Titre encart</label><input type="text" id="cms_adh_title" value="${esc(c.adhesion.title)}" /></div>
    <div class="form-group"><label>Description encart</label><textarea id="cms_adh_text" rows="2">${esc(c.adhesion.text)}</textarea></div>
    <div class="form-group"><label>Avantages (un par ligne)</label><textarea id="cms_adh_benefits" rows="5">${c.adhesion.benefits.join('\n')}</textarea></div>
  </div></div>

  <div class="cms-section"><h3>📞 Section Contact</h3><div class="cms-fields">
    <div class="form-row"><div class="form-group"><label>Badge</label><input type="text" id="cms_contact_badge" value="${esc(c.contact.badge)}" /></div>
    <div class="form-group"><label>Titre</label><input type="text" id="cms_contact_title" value="${esc(c.contact.title)}" /></div></div>
    <div class="form-group"><label>Sous-titre</label><textarea id="cms_contact_subtitle" rows="2">${esc(c.contact.subtitle)}</textarea></div>
    <h4 style="margin:16px 0 6px;">Coordonnées</h4>
    <div class="form-row"><div class="form-group"><label>Téléphone</label><input type="text" id="cms_contact_phone" value="${esc(c.contact.phone)}" /></div>
    <div class="form-group"><label>Email</label><input type="text" id="cms_contact_email" value="${esc(c.contact.email)}" /></div></div>
    <div class="form-row"><div class="form-group"><label>Adresse</label><input type="text" id="cms_contact_address" value="${esc(c.contact.address)}" /></div>
    <div class="form-group"><label>Horaires</label><input type="text" id="cms_contact_hours" value="${esc(c.contact.hours)}" /></div></div>
  </div></div>

  <div class="cms-section"><h3>📄 Pied de page</h3><div class="cms-fields">
    <div class="form-group"><label>Description</label><textarea id="cms_footer_desc" rows="2">${esc(c.footer.description)}</textarea></div>
  </div></div>

  <div class="cms-actions"><button class="btn btn-primary" onclick="saveCMS()" style="padding:14px 40px;font-size:1rem;">💾 Sauvegarder toutes les modifications</button><button class="btn btn-brown" onclick="if(confirm('Réinitialiser tout le contenu ?')){CMS.reset();loadCMSEditor();showAdminToast('✅ Réinitialisé');}">🔄 Réinitialiser</button></div>`;
}

function saveCMS(){
  const c=CMS.get();
  c.hero={title:document.getElementById('cms_hero_title').value,titleAccent:document.getElementById('cms_hero_titleAccent').value,tagline:document.getElementById('cms_hero_tagline').value,btnPrimary:document.getElementById('cms_hero_btnPrimary').value,btnSecondary:document.getElementById('cms_hero_btnSecondary').value};
  c.about.badge=document.getElementById('cms_about_badge').value; c.about.title=document.getElementById('cms_about_title').value; c.about.subtitle=document.getElementById('cms_about_subtitle').value; c.about.cards=collectCards('about',['icon','title','text']);
  c.activities.badge=document.getElementById('cms_act_badge').value; c.activities.title=document.getElementById('cms_act_title').value; c.activities.subtitle=document.getElementById('cms_act_subtitle').value;
  c.activities.cards=collectActCards();
  c.galerie={badge:document.getElementById('cms_galerie_badge').value,title:document.getElementById('cms_galerie_title').value,subtitle:document.getElementById('cms_galerie_subtitle').value};
  c.presseSection={badge:document.getElementById('cms_presse_badge').value,title:document.getElementById('cms_presse_title').value,subtitle:document.getElementById('cms_presse_subtitle').value};
  c.partners=collectCards('partner',['icon','name','desc']); c.press=collectCards('press',['day','month','title','text']);
  c.adhesion={badge:document.getElementById('cms_adh_badge').value,sectionTitle:document.getElementById('cms_adh_sectionTitle').value,sectionSubtitle:document.getElementById('cms_adh_sectionSubtitle').value,title:document.getElementById('cms_adh_title').value,text:document.getElementById('cms_adh_text').value,benefits:document.getElementById('cms_adh_benefits').value.split('\n').filter(b=>b.trim())};
  c.contact={badge:document.getElementById('cms_contact_badge').value,title:document.getElementById('cms_contact_title').value,subtitle:document.getElementById('cms_contact_subtitle').value,phone:document.getElementById('cms_contact_phone').value,email:document.getElementById('cms_contact_email').value,address:document.getElementById('cms_contact_address').value,hours:document.getElementById('cms_contact_hours').value};
  c.footer={description:document.getElementById('cms_footer_desc').value};
  CMS.save(c); showAdminToast('✅ Contenu sauvegardé !');
}
function collectCards(p,f){const c=[];let i=0;while(true){const el=document.querySelector(`[data-field="${p}_card_${f[0]}_${i}"],[data-field="${p}_${f[0]}_${i}"]`);if(!el)break;const card={};f.forEach(k=>{const e=document.querySelector(`[data-field="${p}_card_${k}_${i}"],[data-field="${p}_${k}_${i}"]`);card[k]=e?e.value:'';});c.push(card);i++;}return c;}
function collectActCards(){const cards=[];let i=0;while(true){const tag=document.querySelector(`[data-field="act_card_tag_${i}"]`);if(!tag)break;const title=document.querySelector(`[data-field="act_card_title_${i}"]`);const text=document.querySelector(`[data-field="act_card_text_${i}"]`);const imgVal=document.getElementById(`act_img_val_${i}`);cards.push({tag:tag.value,title:title?title.value:'',text:text?text.value:'',img:imgVal?imgVal.value:'assets/images/activity-culture.png'});i++;}return cards;}
function previewActImg(i,input){if(!input.files||!input.files[0])return;const reader=new FileReader();reader.onload=e=>{document.getElementById(`act_img_preview_${i}`).src=e.target.result;document.getElementById(`act_img_val_${i}`).value=e.target.result;};reader.readAsDataURL(input.files[0]);}
function addCMSCard(t){const c=CMS.get();if(t==='about')c.about.cards.push({icon:'⭐',title:'Nouveau',text:'Description'});if(t==='act')c.activities.cards.push({tag:'Nouveau',title:'Nouvelle activité',text:'Description de l\'activité',img:'assets/images/activity-culture.png'});if(t==='partner')c.partners.push({icon:'🏢',name:'Nouveau',desc:'Description'});if(t==='press')c.press.push({day:'01',month:'Jan',title:'Nouveau',text:'Description'});CMS.save(c);loadCMSEditor();}
function removeCMSCard(t,i){const c=CMS.get();if(t==='about')c.about.cards.splice(i,1);if(t==='act')c.activities.cards.splice(i,1);if(t==='partner')c.partners.splice(i,1);if(t==='press')c.press.splice(i,1);CMS.save(c);loadCMSEditor();showAdminToast('✅ Élément supprimé');}

/* ===== SETTINGS: Multi-Admin ===== */
function renderAdminSettings() {
  const admins = AdminAuth.getAdmins();
  const current = sessionStorage.getItem('ndoguou_logged');
  const container = document.getElementById('adminAccountsList');
  if (!container) return;
  container.innerHTML = admins.map(a => `
    <div class="admin-account-card">
      <div class="admin-account-header">
        <div class="avatar">${a.name.charAt(0).toUpperCase()}</div>
        <div><strong>${a.name}</strong><br/><span style="color:var(--text-light);font-size:0.82rem;">@${a.username} ${a.username===current?'(vous)':''}</span></div>
      </div>
      <div class="setting-row" style="margin-top:12px;">
        <input type="text" placeholder="Nouveau nom" id="name_${a.username}" value="${esc(a.name)}" />
        <div class="pass-wrapper" style="flex:1;"><input type="password" placeholder="Nouveau mot de passe" id="pass_${a.username}" /><button type="button" class="pass-toggle" onclick="togglePass('pass_${a.username}', this)">👁️</button></div>
        <button class="btn btn-primary" onclick="saveAdmin('${a.username}')">💾</button>
      </div>
    </div>
  `).join('');
}

function saveAdmin(username) {
  const nameEl = document.getElementById('name_' + username);
  const passEl = document.getElementById('pass_' + username);
  if (nameEl.value.trim()) AdminAuth.changeName(username, nameEl.value.trim());
  if (passEl.value.length >= 4) AdminAuth.changePassword(username, passEl.value);
  else if (passEl.value.length > 0) { showAdminToast('❌ Mot de passe min 4 caractères'); return; }
  passEl.value = '';
  renderAdminSettings();
  showAdminToast('✅ Compte mis à jour');
}

document.addEventListener('DOMContentLoaded', renderAdminSettings);
