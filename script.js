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
    // The leak meter's score, when the visitor answered all three questions.
    if (form.elements.leak_score && form.elements.leak_score.value) body.append('leak_score', form.elements.leak_score.value);
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

// Leak meter: three questions move the needle and the odometer, then show the X-ray button.
(function () {
  var root = document.getElementById('meter'); if (!root) return;
  root.classList.add('js-on');
  var NS = 'http://www.w3.org/2000/svg', CX = 220, CY = 220, g = root.querySelector('.m-ticks');
  /* score 0..100 maps to 180deg (left) .. 0deg (right) */
  for (var i = 0; i <= 20; i++) {
    var sc = i * 5, a = (180 - sc * 1.8) * Math.PI / 180, maj = i % 2 === 0, r1 = maj ? 154 : 164, r2 = 178;
    var l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', (CX + r1 * Math.cos(a)).toFixed(1)); l.setAttribute('y1', (CY - r1 * Math.sin(a)).toFixed(1));
    l.setAttribute('x2', (CX + r2 * Math.cos(a)).toFixed(1)); l.setAttribute('y2', (CY - r2 * Math.sin(a)).toFixed(1));
    l.setAttribute('pathLength', '1'); l.setAttribute('class', 'm-tick' + (maj ? '' : ' minor')); l.style.setProperty('--i', i);
    g.appendChild(l);
    if (i % 4 === 0) { var t = document.createElementNS(NS, 'text'); t.setAttribute('x', (CX + 196 * Math.cos(a)).toFixed(1)); t.setAttribute('y', (CY - 196 * Math.sin(a) + 5).toFixed(1)); t.setAttribute('class', 'm-n'); t.textContent = sc; g.appendChild(t); }
  }
  var cols = root.querySelectorAll('.m-col');
  cols.forEach(function (c) { for (var d = 0; d <= 9; d++) { var sp = document.createElement('span'); sp.textContent = d; c.appendChild(sp); } });
  var panel = root.querySelector('.m-panel'), needle = root.querySelector('.m-needle'), zoneEl = root.querySelector('.m-zone'),
      resEl = root.querySelector('.m-result'), live = root.querySelector('#m-live'), act = root.querySelector('.m-act'), cta = root.querySelector('.m-cta');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { panel.classList.add('is-in'); io.disconnect(); } }); }, { threshold: .3 });
    io.observe(panel);
  } else panel.classList.add('is-in');
  var Z = [null,
    ['מטופל', 'מטופל. המענה וה־Follow-up מסודרים. השאלה הבאה היא אם הפניות מגיעות מהלקוחות הנכונים.'],
    ['מתקרר', 'מתקרר. יש חורים בתהליך, ובדרך כלל הם ב־Follow-up.'],
    ['נוזל', 'נוזל. כאן הולכות לאיבוד עסקאות, ובשביל זה עושים בדיקת רנטגן.']];
  function update() {
    var checked = root.querySelectorAll('.m-q input:checked'); if (!checked.length) return;
    var sc = 0; checked.forEach(function (r) { sc += parseInt(r.value, 10) || 0; }); sc = Math.min(100, sc);
    needle.style.setProperty('--a', (-90 + sc * 1.8) + 'deg');
    var str = ('00' + sc).slice(-3);
    cols.forEach(function (c, k) { c.style.setProperty('--d', str.charAt(k)); });
    var z = sc <= 20 ? 1 : sc <= 55 ? 2 : 3;
    panel.setAttribute('data-zone', z); zoneEl.textContent = Z[z][0]; resEl.textContent = Z[z][1];
    live.textContent = 'רמת דליפה ' + sc + '. ' + Z[z][1];
    if (checked.length === 3) {
      act.classList.add('is-ready'); cta.classList.add('is-ready');
      var hid = document.getElementById('book-meter'); if (hid) hid.value = sc;
    }
  }
  root.addEventListener('change', function (e) { if (e.target && e.target.type === 'radio') update(); });
})();

// WhatsApp widget: a WhatsApp-style chat that takes a name and phone and sends them to the bot server
// (the same endpoint as the contact form, with source=whatsapp).
(function () {
  'use strict';

  var fab = document.getElementById('waOpen');
  var chat = document.getElementById('waChat');
  if (!fab || !chat) return;

  var LEAD_URL = 'https://76-13-131-217.sslip.io/website/lead';
  var form = document.getElementById('waForm');
  var log = document.getElementById('waLog');
  var nameIn = document.getElementById('wa-name');
  var phoneIn = document.getElementById('wa-phone');
  var send = document.getElementById('waSend');
  var closeBtn = document.getElementById('waClose');
  var sent = false;

  var TICKS = '<svg class="ticks" viewBox="0 0 16 11" aria-hidden="true"><path d="M1 6l3 3 6-7M6 9l1 1 7-8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function LTR(t) { return '\u2066' + t + '\u2069'; }

  function now() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function bubble(kind, text, ticks) {
    var p = document.createElement('p');
    p.className = 'wa-msg ' + kind;
    p.textContent = text;
    var t = document.createElement('time');
    t.textContent = now();
    if (ticks) t.insertAdjacentHTML('beforeend', TICKS);
    p.appendChild(t);
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    return p;
  }

  // Israeli numbers: mobile 05X-XXXXXXX, landline 0X-XXXXXXX, 07X lines, with 0 or +972 / 972 in front.
  function validPhone(v) {
    var d = v.replace(/\D/g, '');
    return /^(?:972|0)(?:5\d{8}|7\d{8}|[23489]\d{7})$/.test(d);
  }

  function mark(input, ok) {
    input.classList.toggle('invalid', !ok);
    if (ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
  }

  function focusables() {
    return Array.prototype.filter.call(
      chat.querySelectorAll('button, input:not([tabindex="-1"]), [href]'),
      function (el) { return !el.disabled && el.offsetParent !== null; }
    );
  }

  function open() {
    chat.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    (sent ? closeBtn : nameIn).focus();
  }
  function close() {
    chat.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }

  fab.addEventListener('click', function () { if (chat.hidden) open(); else close(); });
  closeBtn.addEventListener('click', close);

  chat.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    // Keep the keyboard inside the chat while it's open.
    var els = focusables();
    if (!els.length) return;
    var first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // The button steps aside while the contact form is on screen, so it never covers the form.
  var contact = document.getElementById('contact');
  if (contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { fab.classList.toggle('is-away', en.isIntersecting && chat.hidden); });
    }, { threshold: 0.15 }).observe(contact);
  }

  [nameIn, phoneIn].forEach(function (inp) {
    inp.addEventListener('input', function () { if (inp.classList.contains('invalid')) mark(inp, inp === nameIn ? inp.value.trim().length >= 2 : validPhone(inp.value)); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sent) return;
    var name = nameIn.value.trim();
    var phone = phoneIn.value.trim();
    var okName = name.length >= 2, okPhone = validPhone(phone);
    mark(nameIn, okName); mark(phoneIn, okPhone);
    if (!okName || !okPhone) {
      bubble('err', !okName ? 'נא לכתוב שם.' : 'נא לכתוב מספר טלפון ישראלי תקין, למשל ' + LTR('050\u20111234567') + '.');
      (!okName ? nameIn : phoneIn).focus();
      return;
    }

    // Numbers are isolated left-to-right so they read correctly inside the Hebrew bubble.
    var out = bubble('out', name + '\n' + LTR(phone), true);
    send.disabled = true;

    var body = new URLSearchParams();
    body.append('name', name);
    body.append('phone', phone);
    body.append('source', 'whatsapp');
    var score = document.getElementById('book-meter');
    if (score && score.value) body.append('leak_score', score.value);
    body.append('botcheck', form.elements.botcheck.checked ? 'on' : '');

    function failed(text) {
      // What they typed stays in the fields, so they can just press send again.
      out.remove();
      send.disabled = false;
      bubble('err', text || 'ההודעה לא נשלחה. אפשר לנסות שוב, או לכתוב לנו ל־office@flowtika.com');
    }

    fetch(LEAD_URL, { method: 'POST', body: body })
      .then(function (r) {
        if (r.ok) {
          sent = true;
          form.hidden = true;
          var first = name.split(/\s+/)[0];
          setTimeout(function () { bubble('in', 'מעולה ' + first + ' 🙌 אנחנו כבר מתכוננים לשיחה איתכם. נחזור אליכם בוואטסאפ עם כמה שאלות קצרות על הפניות שלכם.'); closeBtn.focus(); }, 500);
          return;
        }
        if (r.status === 400) return failed('חסר שם או טלפון. השלימו ונסו שוב, או כתבו לנו ל־office@flowtika.com');
        if (r.status === 429) return failed('היו יותר מדי ניסיונות. נסו שוב בעוד כמה דקות, או כתבו לנו ל־office@flowtika.com');
        failed();
      })
      .catch(function () { failed(); });
  });
})();
