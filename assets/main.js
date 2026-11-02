// Red Agave Landscaping — site interactions
(function () {
  // Sticky header shadow
  var header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });
  }

  // Mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Estimate forms: front-end submit with confirmation state.
  // At launch this posts to the Red Agave lead form in HighLevel.
  document.querySelectorAll('.estimate-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameField = form.querySelector('[name="name"]');
      var first = '';
      if (nameField && nameField.value.trim()) {
        first = nameField.value.trim().split(' ')[0];
      }
      var success = form.parentElement.querySelector('.form-success');
      form.style.display = 'none';
      if (success) {
        var slot = success.querySelector('[data-first-name]');
        if (slot && first) slot.textContent = ', ' + first;
        success.hidden = false;
        success.setAttribute('tabindex', '-1');
        success.focus({ preventScroll: false });
      }
    });
  });

  // Animation pass 2026-11-02: scroll reveals + card tilt.
  // Progressive enhancement: if reduced motion is requested or
  // IntersectionObserver is unavailable, nothing here runs and all
  // content stays fully visible (the .js-anim gate in CSS).
  var raReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!raReduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-anim');

    // Scroll reveals with a per-group stagger
    var raTargets = document.querySelectorAll(
      '.section-head, .hero-form-card, .page-hero-in, .trustbar-in, ' +
      '.card, .value, .step, .ba-pair, .gallery-grid figure, ' +
      '.svc, .split > *, .faq details, .booking-note'
    );
    var raCounts = new Map();
    raTargets.forEach(function (el) {
      el.classList.add('reveal');
      var parent = el.parentElement;
      var idx = raCounts.get(parent) || 0;
      raCounts.set(parent, idx + 1);
      el.style.setProperty('--rd', Math.min(idx * 80, 420) + 'ms');
    });
    var raObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          raObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    raTargets.forEach(function (el) { raObserver.observe(el); });

    // Pointer-driven card tilt (fine pointers only; touch gets the
    // CSS :active press state instead)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.card').forEach(function (card) {
        var raf = null;
        var px = 0;
        var py = 0;
        card.addEventListener('pointermove', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
          if (card.classList.contains('reveal') && !card.classList.contains('in')) return;
          var r = card.getBoundingClientRect();
          px = (e.clientX - r.left) / r.width - 0.5;
          py = (e.clientY - r.top) / r.height - 0.5;
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = null;
            card.style.transform =
              'perspective(900px) rotateX(' + (-py * 9).toFixed(2) + 'deg)' +
              ' rotateY(' + (px * 9).toFixed(2) + 'deg) translateY(-8px)';
          });
        });
        card.addEventListener('pointerleave', function () {
          if (raf) { cancelAnimationFrame(raf); raf = null; }
          card.style.transform = '';
        });
      });
    }
  }

  // Footer year
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
