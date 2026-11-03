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

  // Gallery grid balance 2026-11-03: if a photo grid's count
  // leaves a lone orphan on its last row (count % columns == 1),
  // flag it so CSS turns the final tile into a full-width
  // feature tile and the grid ends evenly.
  var raGridBalance = function (grid, cols) {
    if (!grid) return;
    var n = grid.children.length;
    if (n > cols && n % cols === 1) grid.classList.add('grid-feature-last');
  };
  raGridBalance(document.querySelector('.gallery-grid'), 3);
  raGridBalance(document.querySelector('.project-grid'), 2);

  // Photo lightbox 2026-11-03 (Emmanuel): clicking any content
  // photo opens a full-size view with caption, prev/next,
  // keyboard and swipe navigation. Excluded on purpose: the
  // before/after drag sliders (own drag interaction), hero
  // imagery, logos/brand lockups, and header/footer imagery.
  var raLbSelector =
    '.gallery-grid figure img, .ba-pair figure img, .ss-frame img, ' +
    '.card img, .split img, .svc-media img';
  var raLbImgs = [];
  document.querySelectorAll(raLbSelector).forEach(function (img) {
    if (img.closest('[data-ba-slider]')) return;
    if (img.closest('.hero, .page-hero, .site-header, .site-footer')) return;
    if (img.classList.contains('brand-logo')) return;
    var src = img.getAttribute('src') || '';
    if (/logo-(official|profile)/.test(src)) return;
    if (raLbImgs.indexOf(img) !== -1) return;
    raLbImgs.push(img);
  });

  if (raLbImgs.length) {
    // "Tap to enlarge" hint on the gallery page only
    var raGalleryGrid = document.querySelector('.gallery-grid');
    if (raGalleryGrid && document.querySelector('.project-grid')) {
      var hint = document.createElement('p');
      hint.className = 'lb-hint';
      hint.textContent = 'Tap any photo to see it full size — use the arrows to browse.';
      raGalleryGrid.parentNode.insertBefore(hint, raGalleryGrid);
    }

    var raLbCaptionFor = function (img) {
      var fig = img.closest('figure');
      if (fig) {
        var cap = fig.querySelector('figcaption');
        if (cap && cap.textContent.trim()) return cap.textContent.trim();
      }
      var pair = img.closest('.ba-pair');
      if (pair) {
        var baCap = pair.querySelector('.ba-caption');
        if (baCap && baCap.textContent.trim()) return baCap.textContent.trim();
      }
      var card = img.closest('.card');
      if (card) {
        var h = card.querySelector('h3');
        if (h && h.textContent.trim()) return h.textContent.trim();
      }
      return (img.getAttribute('alt') || '').trim();
    };

    var raLbItems = raLbImgs.map(function (img) {
      return {
        el: img,
        src: img.currentSrc || img.src,
        alt: img.getAttribute('alt') || '',
        caption: raLbCaptionFor(img)
      };
    });

    var lb = document.createElement('div');
    lb.className = 'ra-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.hidden = true;
    lb.innerHTML =
      '<figure class="ra-lb-figure">' +
      '<img class="ra-lb-img" src="" alt="">' +
      '<figcaption class="ra-lb-caption"></figcaption>' +
      '<span class="ra-lb-counter" aria-hidden="true"></span>' +
      '</figure>' +
      '<button type="button" class="ra-lb-btn ra-lb-close" aria-label="Close photo viewer">&times;</button>' +
      '<button type="button" class="ra-lb-btn ra-lb-prev" aria-label="Previous photo">&#8249;</button>' +
      '<button type="button" class="ra-lb-btn ra-lb-next" aria-label="Next photo">&#8250;</button>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('.ra-lb-img');
    var lbCap = lb.querySelector('.ra-lb-caption');
    var lbCount = lb.querySelector('.ra-lb-counter');
    var lbClose = lb.querySelector('.ra-lb-close');
    var lbPrev = lb.querySelector('.ra-lb-prev');
    var lbNext = lb.querySelector('.ra-lb-next');
    var lbIndex = 0;
    var lbReturnFocus = null;
    var lbOpen = false;

    var raLbShow = function (i) {
      lbIndex = (i + raLbItems.length) % raLbItems.length;
      var item = raLbItems[lbIndex];
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      lbCap.textContent = item.caption || item.alt;
      lbCap.style.display = (item.caption || item.alt) ? '' : 'none';
      var multi = raLbItems.length > 1;
      lbPrev.style.display = multi ? '' : 'none';
      lbNext.style.display = multi ? '' : 'none';
      lbCount.textContent = multi ? (lbIndex + 1) + ' / ' + raLbItems.length : '';
    };

    var raLbOpenFn = function (i, sourceEl) {
      lbReturnFocus = sourceEl || raLbItems[i].el;
      raLbShow(i);
      lb.hidden = false;
      lbOpen = true;
      document.body.classList.add('ra-lb-open');
      // Force a frame so the fade-in transition runs
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { lb.classList.add('ra-lb-show'); });
      });
      lbClose.focus({ preventScroll: true });
    };

    var raLbCloseFn = function () {
      lb.classList.remove('ra-lb-show');
      lb.hidden = true;
      lbOpen = false;
      document.body.classList.remove('ra-lb-open');
      if (lbReturnFocus && document.contains(lbReturnFocus)) {
        lbReturnFocus.focus({ preventScroll: true });
      }
      lbReturnFocus = null;
    };

    raLbItems.forEach(function (item, i) {
      item.el.classList.add('ra-lb-target');
      item.el.setAttribute('tabindex', '0');
      item.el.setAttribute('role', 'button');
      item.el.setAttribute('aria-label',
        'Enlarge photo: ' + (item.caption || item.alt || 'project photo'));
      item.el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        raLbOpenFn(i, item.el);
      });
      item.el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          raLbOpenFn(i, item.el);
        }
      });
    });

    lbClose.addEventListener('click', raLbCloseFn);
    lbPrev.addEventListener('click', function () { raLbShow(lbIndex - 1); });
    lbNext.addEventListener('click', function () { raLbShow(lbIndex + 1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('ra-lb-figure')) raLbCloseFn();
    });

    document.addEventListener('keydown', function (e) {
      if (!lbOpen) return;
      if (e.key === 'Escape') { raLbCloseFn(); return; }
      if (e.key === 'ArrowLeft') { raLbShow(lbIndex - 1); return; }
      if (e.key === 'ArrowRight') { raLbShow(lbIndex + 1); return; }
      if (e.key === 'Tab') {
        // Simple focus trap: cycle close / prev / next
        var focusables = [lbClose, lbPrev, lbNext].filter(function (b) {
          return b.style.display !== 'none';
        });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        } else if (focusables.indexOf(document.activeElement) === -1) {
          e.preventDefault(); first.focus();
        }
      }
    });

    // Touch swipe left/right to navigate
    var lbTouchX = null;
    lb.addEventListener('touchstart', function (e) {
      if (e.changedTouches.length) lbTouchX = e.changedTouches[0].clientX;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (lbTouchX === null || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - lbTouchX;
      lbTouchX = null;
      if (Math.abs(dx) < 42) return;
      raLbShow(dx < 0 ? lbIndex + 1 : lbIndex - 1);
    }, { passive: true });
  }

  // Footer year
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
