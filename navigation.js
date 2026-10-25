/* Progressive enhancement: the HTML remains readable without this file. */
(function () {
  'use strict';
  var enhanced = false;
  var failed = false;
  var current = null;
  var pages, sidebar, menuButton, topTitle, mobile;

  function fallback(error) {
    failed = true;
    enhanced = false;
    document.documentElement.classList.remove('js');
    if (document.body) document.body.classList.remove('menu-open');
    if (sidebar) sidebar.inert = false;
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    if (window.console && error) console.error('Navigation: showing all chapters.', error);
  }

  function protect(callback) {
    return function () {
      if (failed) return;
      try { return callback.apply(this, arguments); }
      catch (error) { fallback(error); }
    };
  }

  function listen(target, type, callback, options) {
    target.addEventListener(type, protect(callback), options);
  }

  function syncMenu() {
    var opened = document.body.classList.contains('menu-open');
    menuButton.setAttribute('aria-expanded', String(opened));
    sidebar.inert = mobile.matches && !opened;
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    syncMenu();
  }

  function buildSections(page) {
    var old = sidebar.querySelectorAll('ol.subs');
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
    var items = sidebar.querySelectorAll('li[data-page]');
    var selected = null;
    for (var j = 0; j < items.length; j++) {
      var active = items[j].getAttribute('data-page') === page.id;
      items[j].classList.toggle('current', active);
      var link = items[j].querySelector('a');
      if (link) {
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
      if (active) selected = items[j];
    }
    var heads = page.querySelectorAll('section.chapter h3[id]');
    if (!selected || heads.length < 2) return;
    var list = document.createElement('ol');
    list.className = 'subs';
    for (var k = 0; k < heads.length; k++) {
      var heading = heads[k];
      var li = document.createElement('li');
      li.className = heading.classList.contains('sec') ? 'sec' : 'inner';
      var anchor = document.createElement('a');
      anchor.href = '#' + heading.id;
      var tag = heading.querySelector('.sec-tag');
      anchor.textContent = tag ? tag.textContent : heading.textContent;
      li.appendChild(anchor);
      list.appendChild(li);
    }
    selected.appendChild(list);
    if (selected.offsetTop < sidebar.scrollTop ||
        selected.offsetTop > sidebar.scrollTop + sidebar.clientHeight - 60) {
      sidebar.scrollTop = Math.max(0, selected.offsetTop - sidebar.clientHeight / 3);
    }
  }

  function highlightSection() {
    if (!current) return;
    var heads = current.querySelectorAll('section.chapter h3[id]');
    var active = null;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top < 120) active = heads[i];
    }
    var links = sidebar.querySelectorAll('ol.subs a');
    for (var j = 0; j < links.length; j++) {
      links[j].classList.toggle('active', active !== null &&
        links[j].getAttribute('href') === '#' + active.id);
    }
  }

  function show(id) {
    var target = id ? document.getElementById(id) : null;
    var page = target ? target.closest('article.page') : null;
    if (!page) { page = document.getElementById('index'); target = null; }
    if (!page) throw new Error('Missing home page');
    if (page !== current) {
      for (var i = 0; i < pages.length; i++) pages[i].classList.toggle('current', pages[i] === page);
      current = page;
      document.title = page.getAttribute('data-title') || 'Ори в консоли';
      topTitle.textContent = page.getAttribute('data-short') || '';
      buildSections(page);
    }
    closeMenu();
    return target && target !== page ? target : null;
  }

  function moveTo(target) {
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
    highlightSection();
  }

  function fromHash() {
    moveTo(show(location.hash.slice(1)));
  }

  // Unexpected later errors must not leave all chapters hidden.
  window.addEventListener('error', function (event) { fallback(event.error); });
  window.addEventListener('unhandledrejection', function (event) { fallback(event.reason); });

  try {
    pages = Array.prototype.slice.call(document.querySelectorAll('article.page'));
    sidebar = document.getElementById('sidebar');
    menuButton = document.getElementById('menu-button');
    topTitle = document.getElementById('top-title');
    var backdrop = document.getElementById('backdrop');
    if (!pages.length || !sidebar || !menuButton || !topTitle || !backdrop) {
      throw new Error('Missing navigation elements');
    }
    mobile = window.matchMedia ? window.matchMedia('(max-width: 980px)') : { matches: false };
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    listen(menuButton, 'click', function () {
      document.body.classList.toggle('menu-open');
      syncMenu();
      var first = sidebar.querySelector('a');
      if (first && document.body.classList.contains('menu-open')) first.focus();
    });
    listen(backdrop, 'click', closeMenu);
    listen(document, 'keydown', function (event) {
      if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
        closeMenu(); menuButton.focus();
      }
    });
    listen(window, 'resize', syncMenu);
    if (mobile.addEventListener) listen(mobile, 'change', syncMenu);
    listen(document, 'click', function (event) {
      if (!enhanced || event.defaultPrevented || event.button > 0 || event.ctrlKey ||
          event.metaKey || event.shiftKey || event.altKey) return;
      var link = event.target && event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      if (id && !document.getElementById(id)) return;
      var target = show(id); // Do not suppress the native link if navigation throws.
      event.preventDefault();
      try { history.pushState(null, '', '#' + (id || 'index')); }
      catch (error) { location.hash = id || 'index'; }
      moveTo(target);
    });
    listen(window, 'popstate', fromHash);
    listen(window, 'hashchange', fromHash);
    var scheduled = false;
    listen(window, 'scroll', function () {
      if (scheduled) return;
      scheduled = true;
      var run = protect(function () { scheduled = false; highlightSection(); });
      if (window.requestAnimationFrame) window.requestAnimationFrame(run);
      else run();
    }, { passive: true });

    var target = show(location.hash.slice(1));
    document.documentElement.classList.add('js'); // Only after successful setup.
    enhanced = true;
    moveTo(target);
  } catch (error) {
    fallback(error);
  }
})();
