// Flowtika — presentational behaviour only (no business logic).

(function () {
  'use strict';

  // Current year in footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Subtle shadow/border on header after scroll
  var header = document.querySelector('.site-header');
  // Floating CTA: appears once past the hero, hides when the form is in view
  var floatingCta = document.getElementById('floatingCta');
  var contactSection = document.getElementById('contact');

  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);

    if (floatingCta && contactSection) {
      var pastHero = window.scrollY > window.innerHeight * 0.6;
      var contactInView = contactSection.getBoundingClientRect().top < window.innerHeight - 80;
      floatingCta.classList.toggle('show', pastHero && !contactInView);
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Soft fade-in on scroll
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(function (el) { io.observe(el); });
})();

// Lead form: validation, disabled submit, thank-you state, email relay.
(function () {
  'use strict';

  var form = document.getElementById('contactForm');
  if (!form) return;

  var submitBtn = document.getElementById('formSubmit');
  var formError = document.getElementById('formError');
  var formWrap = document.getElementById('formWrap');
  var thanks = document.getElementById('formThanks');

  var defs = [
    { name: 'name',     errId: 'err-name',     msg: 'יש להזין שם',                test: function (v) { return v.trim().length >= 2; } },
    { name: 'phone',    errId: 'err-phone',    msg: 'יש להזין מספר טלפון תקין',   test: function (v) { return v.replace(/\D/g, '').length >= 9; } },
    { name: 'business', errId: 'err-business', msg: 'יש להזין את שם העסק',         test: function (v) { return v.trim().length >= 2; } }
  ];

  var touched = {};
  function el(name) { return form.elements[name]; }
  function isValid(d) { return d.test(el(d.name).value); }

  function renderField(d) {
    var input = el(d.name);
    var errEl = document.getElementById(d.errId);
    var ok = isValid(d);
    if (!ok && touched[d.name]) {
      errEl.textContent = d.msg;
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
    } else {
      errEl.textContent = '';
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
    }
    return ok;
  }

  function refresh() {
    var all = true;
    defs.forEach(function (d) { if (!renderField(d)) all = false; });
    submitBtn.disabled = !all;
    return all;
  }

  defs.forEach(function (d) {
    var input = el(d.name);
    input.addEventListener('input', refresh);
    input.addEventListener('blur', function () { touched[d.name] = true; renderField(d); });
  });
  refresh();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    defs.forEach(function (d) { touched[d.name] = true; });
    if (!refresh()) return;

    formError.textContent = '';
    var original = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'שולח...';

    function succeed() {
      formWrap.hidden = true;
      thanks.hidden = false;
      thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function failed() {
      submitBtn.disabled = false;
      submitBtn.textContent = original;
      formError.textContent = 'אירעה תקלה בשליחה. אפשר לנסות שוב או לכתוב לנו ל-info.flowtika@gmail.com';
    }

    // Email relay not configured yet: preview the thank-you flow without sending.
    var key = el('access_key').value;
    if (/YOUR_WEB3FORMS_ACCESS_KEY/.test(key)) {
      window.setTimeout(succeed, 600);
      return;
    }

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form) })
      .then(function (r) { return r.json(); })
      .then(function (json) { (json && json.success) ? succeed() : failed(); })
      .catch(failed);
  });
})();
