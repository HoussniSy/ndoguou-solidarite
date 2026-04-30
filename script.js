/* ===== NDOGUOU SOLIDARITÉ — Main Script ===== */

document.addEventListener('DOMContentLoaded', () => {

  /* ----- Navbar scroll effect ----- */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    // Active link highlight
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id');
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  });

  /* ----- Mobile menu toggle ----- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
  });
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  /* ----- Scroll reveal animations ----- */
  const fadeEls = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  fadeEls.forEach(el => observer.observe(el));

  /* ----- Gallery ----- */
  const galleryGrid = document.getElementById('galleryGrid');
  const galleryInput = document.getElementById('galleryInput');
  const galleryUpload = document.getElementById('galleryUpload');
  let galleryImages = [];

  // Default gallery images
  const defaultImages = [
    { src: 'assets/images/activity-culture.png', title: 'Festival culturel' },
    { src: 'assets/images/activity-solidarity.png', title: 'Action solidaire' },
    { src: 'assets/images/activity-education.png', title: 'Atelier éducatif' },
    { src: 'assets/images/gallery-collage.png', title: 'Moments partagés' },
    { src: 'assets/images/hero-bg.png', title: 'Art & Culture' },
    { src: 'assets/images/activity-culture.png', title: 'Célébration communautaire' },
  ];

  function renderGallery() {
    galleryGrid.innerHTML = '';
    const allImages = [...defaultImages, ...galleryImages];
    allImages.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-item fade-in visible';
      item.innerHTML = `<img src="${img.src}" alt="${img.title}" loading="lazy" />`;
      item.addEventListener('click', () => openLightbox(idx, allImages));
      galleryGrid.appendChild(item);
    });
  }

  renderGallery();

  // Upload handler
  galleryUpload.addEventListener('click', () => galleryInput.click());
  galleryUpload.addEventListener('dragover', e => { e.preventDefault(); galleryUpload.style.borderColor = 'var(--red)'; });
  galleryUpload.addEventListener('dragleave', () => { galleryUpload.style.borderColor = ''; });
  galleryUpload.addEventListener('drop', e => {
    e.preventDefault();
    galleryUpload.style.borderColor = '';
    handleFiles(e.dataTransfer.files);
  });
  galleryInput.addEventListener('change', e => handleFiles(e.target.files));

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        galleryImages.push({ src: e.target.result, title: file.name.replace(/\.[^.]+$/, '') });
        renderGallery();
        showToast('📸 Photo ajoutée à la galerie !');
      };
      reader.readAsDataURL(file);
    });
  }

  /* ----- Lightbox ----- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  let currentLightbox = 0;
  let currentLightboxImages = [];

  function openLightbox(idx, images) {
    currentLightbox = idx;
    currentLightboxImages = images;
    lightboxImg.src = images[idx].src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  lightboxPrev.addEventListener('click', e => {
    e.stopPropagation();
    currentLightbox = (currentLightbox - 1 + currentLightboxImages.length) % currentLightboxImages.length;
    lightboxImg.src = currentLightboxImages[currentLightbox].src;
  });
  lightboxNext.addEventListener('click', e => {
    e.stopPropagation();
    currentLightbox = (currentLightbox + 1) % currentLightboxImages.length;
    lightboxImg.src = currentLightboxImages[currentLightbox].src;
  });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev.click();
    if (e.key === 'ArrowRight') lightboxNext.click();
  });

  /* ----- QR Code Generation ----- */
  const qrContainer = document.getElementById('qrCanvas');
  // Use current page URL or GitHub Pages URL
  const siteUrl = window.location.href.includes('github.io')
    ? window.location.href
    : window.location.href;

  if (typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
      text: siteUrl,
      width: 200,
      height: 200,
      colorDark: '#2C2419',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  /* ----- Form Handling ----- */
  const adhesionForm = document.getElementById('adhesionForm');
  const contactForm = document.getElementById('contactForm');

  adhesionForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(adhesionForm);
    const nom = document.getElementById('adhNom').value;
    showToast(`✅ Merci ${nom} ! Votre demande d'adhésion a été envoyée.`);
    adhesionForm.reset();
  });

  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    showToast('✅ Message envoyé avec succès ! Nous vous répondrons bientôt.');
    contactForm.reset();
  });

  /* ----- Toast Notification ----- */
  const toast = document.getElementById('toast');
  let toastTimeout;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  /* ----- Counter Animation (stats) ----- */
  function animateCounter(el, target) {
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current) + '+';
    }, 16);
  }

});
