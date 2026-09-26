/* Space branding for the Elysium template.
 *
 * Reads ./aither.config.json (written beside index.html by the Space's deploy
 * workflow) and applies it to whichever page loaded this script. A missing or
 * malformed config falls back to the defaults below, so the page always renders.
 *
 * Exposes the cleaned config as window.AITHER_SPACE and fires an `aither-space`
 * event on window once it is applied.
 *
 * A Space is served from a subpath (https://<user>.github.io/<repo>/), so every
 * URL here resolves against document.baseURI; nothing assumes the site root.
 * `basePath` is exposed for scripts that must build an absolute path.
 */
(function () {
  'use strict';

  var DEFAULTS = {
    name: 'My Space',
    tagline: 'A corner of the web, grown as code.',
    accentColor: '#5ad1ff',
    agentName: 'Aither',
    apiBase: 'https://api.aitherium.com'
  };
  var HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  function text(v, max, fallback) {
    if (typeof v !== 'string') return fallback;
    v = v.replace(/\s+/g, ' ').trim();
    return v ? v.slice(0, max) : fallback;
  }

  function httpsUrl(v, fallback) {
    try {
      var u = new URL(String(v));
      return u.protocol === 'https:' ? u.origin : fallback;
    } catch (e) {
      return fallback;
    }
  }

  // The directory this page is served from, e.g. "/my-space/".
  function pageDir() {
    try { return new URL('.', document.baseURI).pathname; } catch (e) { return '/'; }
  }

  function basePath(v) {
    return typeof v === 'string' && /^\/(?:[A-Za-z0-9._-]+\/)*$/.test(v) ? v : pageDir();
  }

  // A custom domain the owner attached in the repository's Pages settings. Only a
  // plain lowercase hostname is accepted, and never one of the platform's own names.
  var HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
  function customDomain(v) {
    if (typeof v !== 'string' || !HOSTNAME.test(v)) return '';
    if (v === 'aitherium.com' || /\.aitherium\.com$/.test(v)) return '';
    return v;
  }

  // Services on the visitor's own machine the page may look for. Loopback only,
  // at most eight, empty unless the owner lists them.
  var LOOPBACK = /^http:\/\/(?:127\.0\.0\.1|\[::1\]|localhost):\d{1,5}$/;
  function loopbackList(v) {
    if (!Array.isArray(v)) return [];
    return v.filter(function (u) { return typeof u === 'string' && LOOPBACK.test(u); }).slice(0, 8);
  }

  function clean(raw) {
    raw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    return {
      customDomain: customDomain(raw.customDomain),
      localNodes: loopbackList(raw.localNodes),
      localForge: loopbackList(raw.localForge),
      handle: text(raw.handle, 64, ''),
      template: text(raw.template, 32, 'elysium'),
      templateVersion: text(raw.templateVersion, 32, ''),
      name: text(raw.name, 60, DEFAULTS.name),
      tagline: text(raw.tagline, 120, DEFAULTS.tagline),
      accentColor: HEX.test(raw.accentColor || '') ? raw.accentColor : DEFAULTS.accentColor,
      agentName: text(raw.agentName, 40, DEFAULTS.agentName),
      apiBase: httpsUrl(raw.apiBase, DEFAULTS.apiBase),
      basePath: basePath(raw.basePath),
      // 'chat' opens GobboNet's chat directly instead of the Elysium hub.
      start: raw.start === 'chat' ? 'chat' : 'hub'
    };
  }

  // A GobboNet Space (start: 'chat') lands on the chat, not the hub. Only the hub's
  // own index page redirects, and only to the sibling chat.html (never off-site).
  function startPage(cfg) {
    if (cfg.start !== 'chat') return false;
    var p = window.location.pathname;
    if (/\/(index\.html)?$/.test(p)) {
      window.location.replace(p.replace(/(index\.html)?$/, 'chat.html'));
      return true;
    }
    return false;
  }

  function apply(cfg) {
    if (startPage(cfg)) return;
    window.AITHER_SPACE = cfg;
    var root = document.documentElement;
    root.style.setProperty('--space-accent', cfg.accentColor);
    // The hub's primary neon and the chat's primary neon both follow the accent.
    root.style.setProperty('--hub-neon', cfg.accentColor);
    root.style.setProperty('--cyan-bright', cfg.accentColor);
    root.setAttribute('data-space-agent', cfg.agentName);

    document.title = cfg.name + ' — ' + cfg.tagline;
    var meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', cfg.tagline);

    var nodes = document.querySelectorAll('[data-space]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-space');
      if (Object.prototype.hasOwnProperty.call(cfg, key)) nodes[i].textContent = cfg[key];
    }
    try {
      window.dispatchEvent(new CustomEvent('aither-space', { detail: cfg }));
    } catch (e) { /* very old browser: the global is still set */ }
  }

  // Apply the defaults at once so there is no flash of the original branding,
  // then again when the real config arrives.
  apply(clean(null));
  fetch(new URL('aither.config.json', document.baseURI).href, { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (raw) { apply(clean(raw)); });
})();
