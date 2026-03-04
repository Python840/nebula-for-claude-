// content.js — Nebula for Claude v1.1
// Ambient deep-space atmosphere injected into claude.ai
(() => {
  const BG_ID        = 'nebula-bg';
  const STYLE_ID     = 'nebula-dynamic-styles';
  const CSS_ID       = 'nebula-custom-css';
  const HTML_CLASS   = 'nebula-active';
  const LOCAL_BG_KEY = 'customBgData';

  const DEFAULTS = {
    enabled:         true,
    theme:           'void',      // void | nebula | neon | mono
    // Per-element opacity (0–100, stored as strings)
    opacitySidebar:  '75',
    opacityChat:     '40',
    opacityInput:    '85',
    blur:            '20',        // panel backdrop-filter blur in px
    // Custom background
    customBgUrl:     '',          // '' | '__local__' | URL string
    bgBlur:          '60',        // background image blur in px
    bgScale:         'cover',     // 'cover' | 'contain'
    // Effects
    stars:           true,
    gridLines:       false,
    glowAccents:     true,
    focusMode:       false,
    compactMode:     false,
    particles:       false,
    // Advanced
    customCss:       '',
    // Animation
    animSpeed:       'slow',      // slow | medium | off
  };

  // ── Theme palette ─────────────────────────────────────────────────────────
  const THEMES = {
    void: {
      base:  '#020817',
      grad1: '0, 180, 255',
      grad2: '80, 30, 180',
      grad3: '0, 80, 200',
      accent: '#06b6d4',
      glow:  '0, 200, 255',
    },
    nebula: {
      base:  '#05020f',
      grad1: '120, 40, 220',
      grad2: '20, 80, 200',
      grad3: '180, 20, 140',
      accent: '#a855f7',
      glow:  '168, 85, 247',
    },
    neon: {
      base:  '#010a10',
      grad1: '0, 230, 255',
      grad2: '0, 80, 255',
      grad3: '0, 200, 180',
      accent: '#00e5ff',
      glow:  '0, 229, 255',
    },
    mono: {
      base:  '#0a0a0f',
      grad1: '60, 60, 90',
      grad2: '30, 30, 60',
      grad3: '80, 80, 120',
      accent: '#6366f1',
      glow:  '99, 102, 241',
    },
  };

  let settings = { ...DEFAULTS };

  // ── Deterministic star field ───────────────────────────────────────────────
  function generateStarShadows(count) {
    const shadows = [];
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };
    for (let i = 0; i < count; i++) {
      const x    = (rand() * 4000).toFixed(0);
      const y    = (rand() * 2400).toFixed(0);
      const size = rand() > 0.93 ? 2 : 1;
      const op   = (0.2 + rand() * 0.7).toFixed(2);
      const r    = Math.floor(200 + rand() * 55);
      const g    = Math.floor(200 + rand() * 55);
      const b    = Math.floor(220 + rand() * 35);
      shadows.push(`${x}px ${y}px 0 ${size}px rgba(${r},${g},${b},${op})`);
    }
    return shadows.join(',');
  }

  const STAR_SHADOWS_SM = generateStarShadows(400);
  const STAR_SHADOWS_LG = generateStarShadows(80);

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function makeBgNode() {
    const wrap = document.createElement('div');
    wrap.id = BG_ID;
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = `
      <div class="nebula-gradient"></div>
      <img  class="nebula-bg-img"   alt="" aria-hidden="true">
      <video class="nebula-bg-video" playsinline autoplay muted loop></video>
      <div class="nebula-particles"></div>
      <div class="nebula-stars-sm"></div>
      <div class="nebula-stars-lg"></div>
      <div class="nebula-grid"></div>
      <div class="nebula-vignette"></div>
    `;
    return wrap;
  }

  // ── Dynamic styles injection ──────────────────────────────────────────────
  function injectDynamicStyles() {
    const target = document.head || document.documentElement;
    if (!target) return;
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      target.appendChild(el);
    }

    const t         = THEMES[settings.theme] || THEMES.void;
    const opSidebar = (parseInt(settings.opacitySidebar || '75', 10) / 100).toFixed(2);
    const opChat    = (parseInt(settings.opacityChat    || '40', 10) / 100).toFixed(2);
    const opInput   = (parseInt(settings.opacityInput   || '85', 10) / 100).toFixed(2);
    const blr       = `${settings.blur    || '20'}px`;
    const bgBlr     = `${settings.bgBlur  || '60'}px`;
    const bgScale   = settings.bgScale   || 'cover';
    const spd       = { slow: '28s', medium: '14s', off: '0s' }[settings.animSpeed] || '28s';

    el.textContent = `
      :root {
        --nebula-base:       ${t.base};
        --nebula-grad1:      ${t.grad1};
        --nebula-grad2:      ${t.grad2};
        --nebula-grad3:      ${t.grad3};
        --nebula-accent:     ${t.accent};
        --nebula-glow:       ${t.glow};
        --nebula-op-sidebar: ${opSidebar};
        --nebula-op-chat:    ${opChat};
        --nebula-op-input:   ${opInput};
        --nebula-blur:       ${blr};
        --nebula-bg-blur:    ${bgBlr};
        --nebula-anim-speed: ${spd};
      }
      .nebula-bg-img, .nebula-bg-video { object-fit: ${bgScale}; }
      .nebula-stars-sm { box-shadow: ${STAR_SHADOWS_SM}; }
      .nebula-stars-lg { box-shadow: ${STAR_SHADOWS_LG}; }
    `;
  }

  // ── Custom CSS injection ──────────────────────────────────────────────────
  function injectCustomCss() {
    const target = document.head || document.documentElement;
    if (!target) return;
    let el = document.getElementById(CSS_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = CSS_ID;
      target.appendChild(el);
    }
    el.textContent = settings.customCss || '';
  }

  // ── Background media ──────────────────────────────────────────────────────
  const VIDEO_EXTS = ['.mp4', '.webm', '.ogv', '.ogg'];

  function updateBackgroundMedia() {
    const bgNode = document.getElementById(BG_ID);
    if (!bgNode) return;
    const img   = bgNode.querySelector('.nebula-bg-img');
    const video = bgNode.querySelector('.nebula-bg-video');
    if (!img || !video) return;

    const applyMedia = (url) => {
      const lc = url.toLowerCase();
      const isVideo = VIDEO_EXTS.some(e => lc.includes(e)) || url.startsWith('data:video');
      bgNode.classList.add('nebula-custom-bg');
      if (isVideo) {
        video.src          = url;
        video.style.display = 'block';
        img.style.display  = 'none';
        img.src            = '';
      } else {
        img.src            = url;
        img.style.display  = 'block';
        video.style.display = 'none';
        video.src          = '';
      }
    };

    const clearMedia = () => {
      bgNode.classList.remove('nebula-custom-bg');
      img.style.display   = 'none';
      img.src             = '';
      video.style.display = 'none';
      video.src           = '';
    };

    const url = settings.customBgUrl;
    if (!url) {
      clearMedia();
    } else if (url === '__local__') {
      if (!chrome?.storage?.local) { clearMedia(); return; }
      chrome.storage.local.get(LOCAL_BG_KEY, (res) => {
        if (!chrome.runtime.lastError && res[LOCAL_BG_KEY]) applyMedia(res[LOCAL_BG_KEY]);
        else clearMedia();
      });
    } else {
      applyMedia(url);
    }
  }

  // ── Particle system ───────────────────────────────────────────────────────
  function manageParticles() {
    const bgNode = document.getElementById(BG_ID);
    if (!bgNode) return;
    const container = bgNode.querySelector('.nebula-particles');
    if (!container) return;

    if (!settings.particles) {
      container.innerHTML = '';
      return;
    }
    if (container.children.length > 0) return; // already spawned

    for (let i = 0; i < 28; i++) {
      const span = document.createElement('span');
      span.style.setProperty('--px',  `${Math.random() * 100}%`);
      span.style.setProperty('--dur', `${8 + Math.random() * 16}s`);
      span.style.setProperty('--del', `${-(Math.random() * 18)}s`);
      span.style.setProperty('--dx',  `${(Math.random() - 0.5) * 80}px`);
      span.style.setProperty('--sz',  `${1 + Math.random() * 2}px`);
      span.style.setProperty('--op',  `${0.3 + Math.random() * 0.5}`);
      container.appendChild(span);
    }
  }

  // ── Flag / class management ───────────────────────────────────────────────
  function applyFlags() {
    const html = document.documentElement;
    html.classList.toggle(HTML_CLASS,             !!settings.enabled);
    html.classList.toggle('nebula-stars-on',      !!settings.enabled && !!settings.stars);
    html.classList.toggle('nebula-grid-on',       !!settings.enabled && !!settings.gridLines);
    html.classList.toggle('nebula-focus',         !!settings.enabled && !!settings.focusMode);
    html.classList.toggle('nebula-glow-on',       !!settings.enabled && !!settings.glowAccents);
    html.classList.toggle('nebula-compact',       !!settings.enabled && !!settings.compactMode);
    html.classList.toggle('nebula-particles-on',  !!settings.enabled && !!settings.particles);
    html.setAttribute('data-nebula-theme', settings.theme || 'void');
  }

  // ── Background visibility ─────────────────────────────────────────────────
  function showBg() {
    if (document.getElementById(BG_ID)) return;
    const node = makeBgNode();
    const attach = () => document.body.prepend(node);
    if (document.body) attach();
    else document.addEventListener('DOMContentLoaded', attach, { once: true });
  }

  function hideBg() {
    document.getElementById(BG_ID)?.remove();
  }

  // ── Master apply ──────────────────────────────────────────────────────────
  function applyAll() {
    injectDynamicStyles();
    applyFlags();
    if (settings.enabled) showBg(); else hideBg();
    updateBackgroundMedia();
    injectCustomCss();
    manageParticles();
  }

  // ── Keyboard shortcut: Alt+Shift+N ────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
      e.preventDefault();
      if (chrome?.storage?.sync) {
        chrome.storage.sync.set({ enabled: !settings.enabled });
      }
    }
  });

  // ── SPA navigation + observers ────────────────────────────────────────────
  let observersStarted = false;

  function startObservers() {
    if (observersStarted) return;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', startObservers, { once: true });
      return;
    }
    observersStarted = true;

    // Re-inject background if React removes it
    const bodyObserver = new MutationObserver(() => {
      if (settings.enabled && !document.getElementById(BG_ID)) {
        document.body.prepend(makeBgNode());
        updateBackgroundMedia();
        manageParticles();
      }
    });
    bodyObserver.observe(document.body, { childList: true });

    // Re-inject dynamic styles if <head> hydration strips them
    if (document.head) {
      const headObserver = new MutationObserver(() => {
        if (!document.getElementById(STYLE_ID)) injectDynamicStyles();
        if (!document.getElementById(CSS_ID) && settings.customCss) injectCustomCss();
      });
      headObserver.observe(document.head, { childList: true });
    }

    // SPA route detection
    let lastHref = location.href;
    const onNav = () => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      applyAll();
    };
    window.addEventListener('popstate', onNav, { passive: true });
    const wrap = (fn) => function (...args) { fn.apply(this, args); setTimeout(onNav, 0); };
    history.pushState    = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  injectDynamicStyles();
  applyFlags();

  if (chrome?.storage?.sync) {
    chrome.storage.sync.get(DEFAULTS, (res) => {
      settings = { ...DEFAULTS, ...res };
      applyAll();
      startObservers();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        let changed = false;
        for (const key in changes) {
          if (key in settings) { settings[key] = changes[key].newValue; changed = true; }
        }
        if (changed) applyAll();
      } else if (area === 'local' && changes[LOCAL_BG_KEY]) {
        updateBackgroundMedia();
      }
    });
  } else {
    applyAll();
    startObservers();
  }
})();
