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

  // Footer year
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
