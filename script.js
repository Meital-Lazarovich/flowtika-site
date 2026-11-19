// Flowtika: the hero's 100-leads scan, and the lead form (validation, sending to the bot server, sent and error states).

(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Hero: 100 leads as dots; the beam paints each lead's fate column by column. Same order every load.
  document.querySelectorAll('[data-dots]').forEach(function (box) {
    var fates = [];
    for (var i = 0; i < 100; i++) fates.push(i < 26 ? 'stuck' : i < 38 ? 'won' : 'lost');
    var seed = 20261119;
    var rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (var k = fates.length - 1; k > 0; k--) {
      var j = Math.floor(rnd() * (k + 1));
      var t = fates[k]; fates[k] = fates[j]; fates[j] = t;
    }
    fates.forEach(function (f, n) {
      var d = document.createElement('i');
      d.className = 'dot';
      d.dataset.f = f;
      d.style.setProperty('--c', String(n % 20));
      box.appendChild(d);
    });
  });
})();

(function () {
  'use strict';

  var form = document.getElementById('contactForm');
  if (!form) return;

  var submitBtn = document.getElementById('formSubmit');
  var submitLabel = submitBtn.querySelector('span');
  var formError = document.getElementById('formError');
  var formErrorText = document.getElementById('formErrorText');
  var FALLBACK = formErrorText.textContent;
  // The Flowtika bot server saves the lead and alerts Omry.
  var LEAD_URL = 'https://76-13-131-217.sslip.io/website/lead';
  var thanks = document.getElementById('formThanks');
  var thanksTitle = document.getElementById('thanksTitle');

  var rules = {
    name: [function (v) { return v.trim().length >= 2; }, 'יש להזין שם'],
    phone: [function (v) { return v.replace(/\D/g, '').length >= 9; }, 'יש להזין מספר טלפון תקין'],
    business: [function (v) { return v.trim().length >= 2; }, 'יש להזין את שם העסק']
  };

  function check(input) {
    var rule = rules[input.name];
    if (!rule) return true;
    var ok = rule[0](input.value);
    input.classList.toggle('invalid', !ok);
    if (ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
    var err = document.getElementById('err-' + input.name);
    if (err) err.textContent = ok ? '' : rule[1];
    return ok;
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    input.addEventListener('blur', function () { check(input); });
    input.addEventListener('input', function () { if (input.classList.contains('invalid')) check(input); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    var firstBad = null;
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!check(input)) { ok = false; if (!firstBad) firstBad = input; }
    });
    if (!ok) { firstBad.focus(); return; }

    formError.hidden = true;
    var original = submitLabel.textContent;
    submitBtn.disabled = true;
    submitLabel.textContent = 'שולחים...';

    function succeed() {
      var first = form.elements.name.value.trim().split(/\s+/)[0];
      thanksTitle.textContent = first ? 'תודה ' + first + ', קיבלנו' : 'תודה, קיבלנו';
      form.hidden = true;
      thanks.hidden = false;
      thanks.focus({ preventScroll: true });
      thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function failed(text) {
      // The details stay in the form, so the visitor can just press send again.
      submitBtn.disabled = false;
      submitLabel.textContent = original;
      formErrorText.textContent = text || FALLBACK;
      formError.hidden = false;
    }

    // Sent as a form body (not JSON), so the browser needs no CORS preflight.
    var body = new URLSearchParams();
    ['name', 'phone', 'business', 'notes'].forEach(function (f) { body.append(f, form.elements[f].value.trim()); });
    body.append('botcheck', form.elements.botcheck.checked ? 'on' : '');

    fetch(LEAD_URL, { method: 'POST', body: body })
      .then(function (r) {
        if (r.ok) return succeed();
        if (r.status === 400) {
          // The server is missing a name or phone: mark the fields again.
          Object.keys(rules).forEach(function (name) { check(form.elements[name]); });
          return failed('חסר שם או טלפון. השלימו את הפרטים ונסו שוב.');
        }
        if (r.status === 429) return failed('היו יותר מדי ניסיונות. נסו שוב בעוד כמה דקות, או כתבו לנו ל־office@flowtika.com');
        failed();
      })
      .catch(function () { failed(); });
  });
})();
