/* Independent from navigation: clipboard failures never prevent reading. */
(function () {
  'use strict';
  document.addEventListener('click', function (event) {
    var target = event.target;
    var button = target && target.closest ? target.closest('button.copy') : null;
    if (!button) return;
    var figure = button.closest('figure');
    var source = figure && figure.querySelector('textarea.raw');
    if (!source) return;
    var raw = source.value;

    function done(message) {
      button.textContent = message;
      window.setTimeout(function () { button.textContent = 'Копировать'; }, 1800);
    }

    function manualCopy() {
      source.hidden = false;
      source.readOnly = true;
      source.setAttribute('aria-label', 'Готовый исходник для ручного копирования');
      source.focus();
      source.select();
      done('Исходник выделен — Ctrl+C (на телефоне: Копировать)');
    }

    function legacyCopy() {
      var helper = document.createElement('textarea');
      helper.value = raw;
      helper.className = 'clipboard-helper';
      helper.setAttribute('readonly', '');
      helper.setAttribute('aria-hidden', 'true');
      var ok = false;
      try {
        document.body.appendChild(helper);
        helper.select();
        if (typeof document.execCommand === 'function') ok = document.execCommand('copy');
      } catch (error) {
        ok = false;
      } finally {
        if (helper.parentNode) helper.parentNode.removeChild(helper);
      }
      if (ok) { button.focus(); done('Скопировано'); }
      else manualCopy();
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        Promise.resolve(navigator.clipboard.writeText(raw)).then(function () {
          done('Скопировано');
        }, legacyCopy);
      } else legacyCopy();
    } catch (error) {
      legacyCopy();
    }
  });
})();
