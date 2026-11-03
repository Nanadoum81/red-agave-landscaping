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

  // Estimate forms: post the lead to the Red Agave HighLevel workflow
  // "Website Form to Pipeline" via its inbound webhook. The workflow maps
  // first_name, last_name, phone and email from the QUERY STRING, so those
  // four always ride as query parameters; the JSON body carries every form
  // field for completeness. On success the existing thank-you state shows;
  // on failure the visitor gets a call-us fallback instead of a dead end.
  var LEAD_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/f7IK70SRPnTvfqmfR4V1/webhook-trigger/7db24c31-2341-4b96-9dec-7b26b06791aa';

  document.querySelectorAll('.estimate-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var get = function (n) {
        var f = form.querySelector('[name="' + n + '"]');
        return f ? f.value.trim() : '';
      };
      var fullName = get('name');
      var nameParts = fullName ? fullName.split(/\s+/) : [];
      var firstName = nameParts.length ? nameParts[0] : '';
      var lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      var consent = form.querySelector('[name="sms-consent"]');

      var payload = {
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        phone: get('phone'),
        email: get('email'),
        service: get('service'),
        message: get('details'),
        details: get('details'),
        address: get('address'),
        sms_consent: consent && consent.checked ? 'yes' : 'no',
        source_page: window.location.pathname
      };
      var photo = form.querySelector('[name="yard-photo"]');
      if (photo && photo.files && photo.files.length) {
        payload.yard_photo_name = photo.files[0].name;
      }

      var qs = new URLSearchParams({
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        email: payload.email
      }).toString();

      var button = form.querySelector('button[type="submit"]');
      var errorBox = form.parentElement.querySelector('.form-error');
      if (errorBox) errorBox.hidden = true;
      if (button) {
        button.disabled = true;
        if (!button.dataset.label) button.dataset.label = button.textContent;
        button.textContent = 'Sending...';
      }

      fetch(LEAD_WEBHOOK_URL + '?' + qs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('webhook status ' + res.status);
        var success = form.parentElement.querySelector('.form-success');
        form.style.display = 'none';
        if (success) {
          var slot = success.querySelector('[data-first-name]');
          if (slot && firstName) slot.textContent = ', ' + firstName;
          success.hidden = false;
          success.setAttribute('tabindex', '-1');
          success.focus({ preventScroll: false });
        }
      }).catch(function () {
        if (button) {
          button.disabled = false;
          button.textContent = button.dataset.label || 'Get My Free Estimate';
        }
        if (errorBox) {
          errorBox.hidden = false;
          errorBox.setAttribute('tabindex', '-1');
          errorBox.focus({ preventScroll: false });
        }
      });
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
      '.svc, .split > *, .faq details, .booking-note, .ss-card'
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

  // Before/after drag sliders: range input drives a clip reveal.
  // On first scroll into view the handle sweeps once to invite a
  // drag (skipped for reduced motion or after any interaction).
  document.querySelectorAll('[data-ba-slider]').forEach(function (box) {
    var range = box.querySelector('.ba-range');
    if (!range) return;
    var touched = false;
    var setPos = function (v) { box.style.setProperty('--pos', v + '%'); };
    setPos(range.value);
    range.addEventListener('input', function () { touched = true; setPos(range.value); });
    range.addEventListener('pointerdown', function () { touched = true; });
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.disconnect();
          var start = null;
          var sweep = function (ts) {
            if (touched) return;
            if (!start) start = ts;
            var t = Math.min((ts - start) / 1900, 1);
            var pos = 50 + Math.sin(t * Math.PI) * 27;
            setPos(pos.toFixed(1));
            range.value = pos;
            if (t < 1) requestAnimationFrame(sweep);
          };
          requestAnimationFrame(sweep);
        });
      }, { threshold: 0.35 });
      io.observe(box);
    }
  });

  // Footer year
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
