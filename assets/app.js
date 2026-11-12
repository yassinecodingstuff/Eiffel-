(function () {
  'use strict';

  /* Adresse de la billetterie en ligne. Tant qu'elle est vide, les boutons mènent aux tarifs. */
  var BILLETTERIE_URL = '';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (BILLETTERIE_URL) {
    $$('[data-billet]').forEach(function (a) { a.href = BILLETTERIE_URL; a.target = '_blank'; a.rel = 'noopener'; });
  }

  /* ---------- Menu mobile ---------- */
  var burger = $('.burger'), menu = $('#menu');
  function setMenu(open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.lastElementChild.textContent = open ? 'Fermer' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
  window.matchMedia('(min-width: 1061px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* ---------- Vues : l'accueil et les pages secondaires partagent le même document ---------- */
  var PAGES = ['reserver-groupe', 'privatisation', 'mentions-legales', 'confidentialite'];
  var views = $$('[data-view]');
  var current = 'accueil';
  function route() {
    var id = decodeURIComponent(location.hash.slice(1));
    var page = PAGES.indexOf(id) > -1 ? id : 'accueil';
    var changed = page !== current;
    views.forEach(function (v) { v.hidden = v.dataset.view !== page; });
    document.body.classList.toggle('is-page', page !== 'accueil');
    current = page;
    setMenu(false);
    if (page !== 'accueil') { window.scrollTo(0, 0); return; }
    var target = id && document.getElementById(id);
    if (changed) {
      requestAnimationFrame(function () {
        if (target) target.scrollIntoView({ behavior: 'auto' }); else window.scrollTo(0, 0);
        refresh();
      });
    } else if (target) {
      target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
    }
  }
  window.addEventListener('hashchange', route);

  /* ---------- En-tête, couverture, rubrique active ---------- */
  var header = $('.site-header'), hero = $('.hero'), cover = $('.cover');
  var navLinks = $$('.nav a');
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var ticking = false;
  function refresh() {
    ticking = false;
    var y = window.scrollY;
    header.classList.toggle('is-solid', y > 24);
    if (!calm && cover) {
      var p = Math.min(1, Math.max(0, y / (hero.offsetHeight * 0.75)));
      cover.style.setProperty('--p', p.toFixed(3));
    }
    var mark = y + window.innerHeight * 0.35, active = -1;
    if (current === 'accueil') sections.forEach(function (s, i) { if (s && s.offsetTop <= mark && s.offsetTop + s.offsetHeight > mark) active = i; });
    navLinks.forEach(function (a, i) { if (i === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(refresh); } }, { passive: true });
  window.addEventListener('resize', refresh);

  /* ---------- Carrousel (revue de presse) ---------- */
  $$('[data-carousel]').forEach(function (root) {
    var track = $('[data-track]', root), prev = $('[data-prev]', root), next = $('[data-next]', root);
    var items = Array.prototype.slice.call(track.children);
    function step() { return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth; }
    function index() { return Math.min(items.length - 1, Math.round(track.scrollLeft / step())); }
    function go(i) { track.scrollTo({ left: i * step(), behavior: calm ? 'auto' : 'smooth' }); }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    }
    prev.addEventListener('click', function () { go(Math.max(0, index() - 1)); });
    next.addEventListener('click', function () { go(index() + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.max(0, index() - 1)); }
    });
    var wait = false;
    track.addEventListener('scroll', function () { if (!wait) { wait = true; requestAnimationFrame(function () { wait = false; update(); }); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Onglets des questions ---------- */
  var tabs = $$('[role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        selectTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
      }
    });
  });

  /* ---------- Visionneuse ---------- */
  var box = $('.lightbox');
  if (box && box.showModal) {
    var big = $('img', box), cap = $('figcaption span', box);
    $$('.tile').forEach(function (t) {
      t.addEventListener('click', function () {
        var img = $('img', t);
        big.src = img.currentSrc || img.src;
        big.alt = img.alt.replace(' Agrandir.', '');
        cap.textContent = t.dataset.caption || '';
        box.showModal();
      });
    });
    box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('[data-close]')) box.close(); });
  }

  /* ---------- Formulaires (maquette : aucune donnée n'est envoyée) ---------- */
  $$('.form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var done = form.nextElementSibling;
      form.hidden = true; done.hidden = false; done.focus();
    });
  });

  /* ---------- Cookies ---------- */
  var cookie = $('.cookie'), KEY = 'ge-cookies';
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (err) { choice = null; }
  if (!choice) cookie.hidden = false;
  $$('[data-cookie]').forEach(function (b) {
    b.addEventListener('click', function () {
      try { localStorage.setItem(KEY, b.dataset.cookie); } catch (err) { /* stockage indisponible : le choix vaut pour la visite */ }
      cookie.hidden = true;
    });
  });
  $('[data-cookie-open]').addEventListener('click', function () { cookie.hidden = false; $('button', cookie).focus(); });

  route();
  refresh();
})();
