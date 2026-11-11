/* One long page: scroll animations, scroll-spy navigation, interactions */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var header = $('.site-header'), bar = $('.progress');
  var btn = $('.menu-btn'), links = $('.links');
  var sections = $$('section.page');
  var navLinks = $$('.links a[data-page]');

  /* ---------- scroll reveal ---------- */
  var items = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- scroll progress + sticky header ---------- */
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
    if (header) header.classList.toggle('scrolled', h.scrollTop > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- scroll-spy: highlight the section being viewed ---------- */
  function setActive(id) {
    navLinks.forEach(function (a) {
      if (a.getAttribute('data-page') === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -54% 0px', threshold: 0 });   // thin band across the middle of the screen
    sections.forEach(function (s) { spy.observe(s); });
  }
  setActive('home');

  /* ---------- mobile menu ---------- */
  function closeMenu() {
    if (links) links.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  if (btn && links) {
    btn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  $$('a[href^="#"]').forEach(function (a) { a.addEventListener('click', closeMenu); });

  /* ---------- marquee: duplicate once for a seamless loop ---------- */
  $$('.marquee-track').forEach(function (t) { t.innerHTML += t.innerHTML; });

  /* ---------- portfolio filters ---------- */
  var chips = $$('.chip[data-filter]');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      var f = c.getAttribute('data-filter');
      $$('.work').forEach(function (w) {
        w.classList.toggle('hide', !(f === 'all' || w.getAttribute('data-cat') === f));
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  $$('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var a = q.nextElementSibling, open = q.getAttribute('aria-expanded') === 'true';
      $$('.faq-q').forEach(function (o) {
        o.setAttribute('aria-expanded', 'false');
        o.nextElementSibling.style.maxHeight = null;
        o.nextElementSibling.classList.remove('open');
      });
      if (!open) {
        q.setAttribute('aria-expanded', 'true');
        a.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------- pricing monthly / yearly toggle ---------- */
  var tg = $('.toggle');
  if (tg) {
    var tb = $$('button', tg), thumb = $('.thumb', tg);
    var place = function () {
      var b = tb.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; })[0] || tb[0];
      thumb.style.width = b.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    };
    tb.forEach(function (b) {
      b.addEventListener('click', function () {
        tb.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        place();
        var mode = b.getAttribute('data-mode');
        $$('.price').forEach(function (p) {
          p.textContent = p.getAttribute(mode === 'yearly' ? 'data-y' : 'data-m');
          p.classList.remove('flip'); void p.offsetWidth; p.classList.add('flip');
        });
      });
    });
    place();
    window.addEventListener('resize', place);
    window.addEventListener('load', place);
  }

  /* ---------- contact form (front-end only, nothing is sent) ---------- */
  var form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('.input[required]', form).forEach(function (i) {
        var bad = !i.value.trim() || (i.type === 'email' && i.value.indexOf('@') < 1);
        i.classList.remove('bad');
        if (bad) { void i.offsetWidth; i.classList.add('bad'); ok = false; }
      });
      var m = $('.msg', form);
      m.classList.remove('show'); void m.offsetWidth;
      m.textContent = ok ? 'Thanks! This is a skeleton form, so nothing was sent.' : 'Please fill in the highlighted fields.';
      m.classList.add('show');
    });
  }
})();
