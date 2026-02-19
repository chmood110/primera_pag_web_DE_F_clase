/* ================================================================
   ALGORITMIA — app.js
   Funciones: sidebar toggle, progreso, back-to-top,
              active section, tema oscuro, validación formulario
   ================================================================ */

(function () {
  'use strict';

  /* ── Utilidades ─────────────────────────────────────────────── */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ── Tema oscuro/claro ──────────────────────────────────────── */
  const THEME_KEY = 'algo-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = $('#theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀ Calma' : '◑ Oscuro';
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(saved);
    const btn = $('#theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  /* ── Sidebar móvil ──────────────────────────────────────────── */
  function initSidebar() {
    const toggle  = $('#sidebar-toggle');
    const sidebar = $('.sidebar');
    const overlay = $('.sidebar-overlay');

    if (!toggle || !sidebar) return;

    function openSidebar() {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.contains('open');
      isOpen ? closeSidebar() : openSidebar();
    });

    if (overlay) {
      overlay.addEventListener('click', closeSidebar);
    }

    // Cerrar al hacer clic en enlace del sidebar
    $$('a', sidebar).forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) closeSidebar();
      });
    });

    // Tecla ESC
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
    });
  }

  /* ── Barra de progreso de lectura ───────────────────────────── */
  function initProgressBar() {
    const bar = $('#progress-bar');
    if (!bar) return;

    function updateProgress() {
      const scrollTop  = window.scrollY || document.documentElement.scrollTop;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      const percent    = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width  = Math.min(percent, 100) + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ── Botón volver arriba ────────────────────────────────────── */
  function initBackToTop() {
    const btn = $('#back-to-top');
    if (!btn) return;

    function onScroll() {
      btn.classList.toggle('visible', window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── Destacar sección activa (sidebar IntersectionObserver) ─── */
  function initActiveSection() {
    const sidebarLinks = $$('.sidebar nav a[href*="#"]');
    if (!sidebarLinks.length) return;

    // Obtener todos los ids de las secciones que el sidebar menciona
    const ids = sidebarLinks.map(a => {
      const hash = a.getAttribute('href').split('#')[1];
      return hash;
    }).filter(Boolean);

    const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    let current = '';

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) current = entry.target.id;
      });
      sidebarLinks.forEach(a => {
        const hash = a.getAttribute('href').split('#')[1];
        a.classList.toggle('active', hash === current);
      });
    }, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(sec => observer.observe(sec));
  }

  /* ── Marcar página activa en header nav ─────────────────────── */
  function initActiveNav() {
    const page  = location.pathname.split('/').pop() || 'index.html';
    $$('header .header-nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const hpage = href.split('/').pop().split('#')[0] || 'index.html';
      a.classList.toggle('active', hpage === page);
    });
  }

  /* ── Hints de ejercicios ────────────────────────────────────── */
  function initHints() {
    $$('.hint-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const hint = btn.nextElementSibling;
        if (!hint) return;
        const isOpen = hint.classList.contains('open');
        hint.classList.toggle('open', !isOpen);
        btn.textContent = isOpen ? '💡 Ver pista' : '🙈 Ocultar pista';
      });
    });
  }

  /* ── Validación formulario de contacto ──────────────────────── */
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    const toast    = $('#form-toast');
    const fields   = {
      nombre:  { el: $('#f-nombre'),  err: $('#e-nombre') },
      correo:  { el: $('#f-correo'),  err: $('#e-correo') },
      mensaje: { el: $('#f-mensaje'), err: $('#e-mensaje') }
    };

    function showError(field, msg) {
      field.el.classList.add('error');
      field.err.textContent = msg;
      field.err.classList.add('visible');
    }
    function clearError(field) {
      field.el.classList.remove('error');
      field.err.textContent = '';
      field.err.classList.remove('visible');
    }
    function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    // Limpiar error al escribir
    Object.values(fields).forEach(f => {
      f.el.addEventListener('input', () => clearError(f));
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      let ok = true;
      const vals = {
        nombre:  fields.nombre.el.value.trim(),
        correo:  fields.correo.el.value.trim(),
        mensaje: fields.mensaje.el.value.trim()
      };

      if (!vals.nombre || vals.nombre.length < 2) {
        showError(fields.nombre, 'Por favor ingresa tu nombre (mínimo 2 caracteres).');
        ok = false;
      }
      if (!vals.correo || !isValidEmail(vals.correo)) {
        showError(fields.correo, 'Ingresa un correo electrónico válido, por ejemplo: nombre@dominio.com');
        ok = false;
      }
      if (!vals.mensaje || vals.mensaje.length < 10) {
        showError(fields.mensaje, 'El mensaje debe tener al menos 10 caracteres.');
        ok = false;
      }

      if (!ok) {
        // Llevar el foco al primer error
        const firstErr = form.querySelector('.error');
        if (firstErr) firstErr.focus();
        return;
      }

      // Éxito
      if (toast) {
        toast.classList.add('visible');
        toast.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      form.reset();
      // Limpiar errores residuales
      Object.values(fields).forEach(clearError);
    });
  }

  /* ── Init ───────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initProgressBar();
    initBackToTop();
    initActiveSection();
    initActiveNav();
    initHints();
    initContactForm();
  });

})();