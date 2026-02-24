/* =========================================
   SCRIPT.JS — ulinnuha.eth Portfolio
   ========================================= */

/* === NAVBAR === */
(function initNavbar() {
  const navbar  = document.querySelector('.navbar');
  const toggle  = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-links');

  // Scroll effect
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // Mobile toggle
  if (toggle && navMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.querySelectorAll('span').forEach((s, i) => {
        s.style.transform = isOpen
          ? (i === 0 ? 'rotate(45deg) translate(5px, 5px)'
           : i === 1 ? 'scaleX(0)'
           : 'rotate(-45deg) translate(5px, -5px)')
          : '';
        s.style.opacity = (isOpen && i === 1) ? '0' : '1';
      });
    });

    // Close on link click
    navMenu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        navMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelectorAll('span').forEach(s => {
          s.style.transform = '';
          s.style.opacity = '1';
        });
      })
    );
  }

  // Mark active link
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').replace('./', '');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

/* === SCROLL FADE-IN === */
(function initScrollObserver() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
})();

/* === TABS === */
(function initTabs() {
  const btnList = document.querySelectorAll('.tab-btn');
  if (!btnList.length) return;

  btnList.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      btnList.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById('tab-' + target);
      if (panel) panel.classList.add('active');
    });
  });
})();

/* === LIGHTBOX dengan info panel + CountAPI view counter === */
(function initLightbox() {
  const lb          = document.getElementById('lightbox');
  const lbImg       = document.getElementById('lightbox-img');
  const lbClose     = document.getElementById('lightbox-close');
  const lbInfo      = document.getElementById('lightbox-info');
  const lbTitle     = document.getElementById('lightbox-title');
  const lbDesc      = document.getElementById('lightbox-desc');
  const lbDate      = document.getElementById('lightbox-date');
  const lbViewsEl   = document.getElementById('lightbox-views-count');
  if (!lb) return;

  /* Namespace CountAPI — ganti jika perlu */
  const COUNT_NS = 'ulinnuha-gallery';

  /* Ambil & tambah view dari CountAPI */
  async function fetchAndIncrementView(key) {
    if (!key) { lbViewsEl.textContent = '—'; return; }
    lbViewsEl.textContent = '...';
    try {
      /* hit = tambah 1 sekaligus ambil nilai baru */
      const res  = await fetch(`https://api.countapi.xyz/hit/${COUNT_NS}/${key}`);
      const data = await res.json();
      lbViewsEl.textContent = data.value !== undefined
        ? data.value.toLocaleString()
        : '—';
    } catch {
      lbViewsEl.textContent = '—';
    }
  }

  /* Buka lightbox */
  function open(item) {
    const img   = item.querySelector('img');
    if (!img) return;

    /* Gambar */
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';

    /* Data dari attributes */
    const title = item.dataset.title || img.alt || 'Untitled';
    const desc  = item.dataset.desc  || '';
    const date  = item.dataset.date  || '';
    const key   = item.dataset.key   || '';

    /* Isi panel info */
    lbTitle.textContent = title;
    lbDesc.textContent  = desc  || '—';

    /* Date dengan icon (icon sudah ada di HTML, update teks saja) */
    lbDate.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      ${date || '—'}`;

    /* Buka overlay */
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';

    /* Fetch view count (async, tidak block UI) */
    fetchAndIncrementView(key);
  }

  /* Tutup lightbox */
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      lbImg.src = '';
      lbTitle.textContent = '—';
      lbDesc.textContent  = '—';
      lbViewsEl.textContent = '—';
    }, 250);
  }

  /* Klik item masonry */
  document.querySelectorAll('.masonry-item').forEach(item => {
    item.addEventListener('click', () => open(item));
  });

  /* Tombol close */
  if (lbClose) lbClose.addEventListener('click', close);

  /* Klik backdrop */
  lb.addEventListener('click', e => {
    if (e.target === lb) close();
  });

  /* Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lb.classList.contains('open')) close();
  });
})();

/* === SMOOTH SCROLL for anchor links === */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id  = a.getAttribute('href').slice(1);
    const el  = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* === CURSOR GLOW (subtle, desktop only) === */
(function initCursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip touch

  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed;
    pointer-events: none;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    z-index: 0;
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(glow);

  let px = -999, py = -999;
  document.addEventListener('mousemove', e => {
    px = e.clientX;
    py = e.clientY;
    glow.style.left = px + 'px';
    glow.style.top  = py + 'px';
  }, { passive: true });

  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });
})();
