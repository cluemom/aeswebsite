/**
 * cms.js — AES Content Loader
 * Priority: localStorage (instant admin preview) → content.json
 *
 * data-cms="path.to.value"    → sets innerHTML
 * data-cms-bg="path.to.value" → sets style.backgroundImage
 * data-cms-src="path.to.value"→ sets img.src
 * data-cms-val="path.to.value"→ sets input.value or form.action
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'aes_content';

  function getPath(obj, path) {
    return path.split('.').reduce(function (acc, k) {
      return acc != null ? acc[k] : undefined;
    }, obj);
  }

  function setPath(obj, path, value) {
    var keys = path.split('.'), last = keys.pop();
    var target = keys.reduce(function (acc, k) {
      if (acc[k] == null || typeof acc[k] !== 'object') acc[k] = {};
      return acc[k];
    }, obj);
    target[last] = value;
  }

  async function getContent() {
    // 1. localStorage — admin edits appear instantly after saving a slot
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}

    // 2. Static content.json (served by Render)
    try {
      var r = await fetch('/content.json');
      if (r.ok) return await r.json();
    } catch (e) {}

    return {};
  }

  function setContent(obj) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (e) {}
  }

  function inject(content) {
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var v = getPath(content, el.getAttribute('data-cms'));
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-cms-bg]').forEach(function (el) {
      var v = getPath(content, el.getAttribute('data-cms-bg'));
      if (v) el.style.backgroundImage = "url('" + v + "')";
    });
    document.querySelectorAll('[data-cms-src]').forEach(function (el) {
      var v = getPath(content, el.getAttribute('data-cms-src'));
      if (v) el.src = v;
    });
    document.querySelectorAll('[data-cms-val]').forEach(function (el) {
      var v = getPath(content, el.getAttribute('data-cms-val'));
      if (v != null) { el.tagName === 'FORM' ? (el.action = v) : (el.value = v); }
    });
  }

  async function init() {
    var content = await getContent();
    window._cmsContent = content;
    inject(content);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CMS = { getContent: getContent, setContent: setContent, getPath: getPath, setPath: setPath, reload: init };
})();
