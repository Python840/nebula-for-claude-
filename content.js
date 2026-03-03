// content.js — Nebula for Claude
// Ambient deep-space atmosphere injected into claude.ai
(() => {
  const BG_ID        = 'nebula-bg';
  const STYLE_ID     = 'nebula-dynamic-styles';
  const HTML_CLASS   = 'nebula-active';

  const DEFAULTS = {
    enabled:        true,
    theme:          'void',     // void | nebula | neon | mono
    panelOpacity:   '75',       // 0–100
    blur:           '20',       // backdrop blur in px
    stars:          true,
    gridLines:      false,
    focusMode:      false,
    glowAccents:    true,
    animSpeed:      'slow',     // slow | medium | off
  };

  // ── Theme palette ─────────────────────────────────────────────────────────
  const THEMES = {
    void: {
      base:     '#020817',
      grad1:    '0, 180, 255',    // cyan
      grad2:    '80, 30, 180',    // deep violet
      grad3:    '0, 80, 200',     // electric blue
      accent:   '#06b6d4',
      glow:     '0, 200, 255',
    },
    nebula: {
      base:     '#05020f',
      grad1:    '120, 40, 220',   // purple
      grad2:    '20, 80, 200',    // blue
      grad3:    '180, 20, 140',   // magenta
      accent:   '#a855f7',
      glow:     '168, 85, 247',
    },
    neon: {
      base:     '#010a10',
      grad1:    '0, 230, 255',    // vivid cyan
      grad2:    '0, 80, 255',     // electric blue
      grad3:    '0, 200, 180',    // teal
      accent:   '#00e5ff',
      glow:     '0, 229, 255',
    },
    mono: {
      base:     '#0a0a0f',
      grad1:    '60, 60, 90',     // slate
      grad2:    '30, 30, 60',     // deep slate
      grad3:    '80, 80, 120',    // muted blue-grey
      accent:   '#6366f1',
      glow:     '99, 102, 241',
    },
  };

  let settings = { ...DEFAULTS };

  // ── Star field generator ───────────────────────────────────────────────────
  // Uses a deterministic pseudo-random sequence so stars are stable across reloads
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

  const STAR_SHADOWS_SM  = generateStarShadows(400);   // small/dim
  const STAR_SHADOWS_LG  = generateStarShadows(80);    // large/bright

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function makeBgNode() {
    const wrap = document.createElement('div');
    wrap.id = BG_ID;
    wrap.setAttribute('aria-hidden', 'true');

    wrap.innerHTML = `
      <div class="nebula-gradient"></div>
      <div class="nebula-stars-sm"></div>
      <div class="nebula-stars-lg"></div>
      <div class="nebula-grid"></div>
      <div class="nebula-vignette"></div>
    `;
    return wrap;
  }

  function injectDynamicStyles() {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }

    const t   = THEMES[settings.theme] || THEMES.void;
    const op  = (parseInt(settings.panelOpacity, 10) / 100).toFixed(2);
    const blr = `${settings.blur || '20'}px`;
    const spd = { slow: '28s', medium: '14s', off: '0s' }[settings.animSpeed] || '28s';

    el.textContent = `
      :root {
        --nebula-base:        ${t.base};
        --nebula-grad1:       ${t.grad1};
        --nebula-grad2:       ${t.grad2};
        --nebula-grad3:       ${t.grad3};
        --nebula-accent:      ${t.accent};
        --nebula-glow:        ${t.glow};
        --nebula-panel-op:    ${op};
        --nebula-blur:        ${blr};
        --nebula-anim-speed:  ${spd};
      }

      /* Stars (box-shadow technique on 1×1 elements) */
      .nebula-stars-sm {
        box-shadow: ${STAR_SHADOWS_SM};
      }
      .nebula-stars-lg {
        box-shadow: ${STAR_SHADOWS_LG};
      }
    `;
  }

  function showBg() {
    if (document.getElementById(BG_ID)) return;
    const node = makeBgNode();
    const attach = () => {
      document.body.prepend(node);
    };
    if (document.body) attach();
    else document.addEventListener('DOMContentLoaded', attach, { once: true });
  }

  function hideBg() {
    document.getElementById(BG_ID)?.remove();
  }

  function applyFlags() {
    const html = document.documentElement;
    html.classList.toggle(HTML_CLASS,           !!settings.enabled);
    html.classList.toggle('nebula-stars-on',    !!settings.enabled && !!settings.stars);
    html.classList.toggle('nebula-grid-on',     !!settings.enabled && !!settings.gridLines);
    html.classList.toggle('nebula-focus',       !!settings.enabled && !!settings.focusMode);
    html.classList.toggle('nebula-glow-on',     !!settings.enabled && !!settings.glowAccents);
    html.setAttribute('data-nebula-theme',      settings.theme || 'void');
  }

  function applyAll() {
    injectDynamicStyles();
    applyFlags();
    if (settings.enabled) showBg();
    else hideBg();
  }

  // ── SPA navigation (claude.ai is a Next.js SPA) ───────────────────────────
  let observersStarted = false;
  function startObservers() {
    if (observersStarted) return;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', startObservers, { once: true });
      return;
    }
    observersStarted = true;

    // Re-inject bg if it gets removed by a React render
    const bodyObserver = new MutationObserver(() => {
      if (settings.enabled && !document.getElementById(BG_ID)) {
        document.body.prepend(makeBgNode());
      }
    });
    bodyObserver.observe(document.body, { childList: true });

    // SPA route changes
    let lastHref = location.href;
    const onNav = () => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        applyAll();
      }
    };
    window.addEventListener('popstate', onNav, { passive: true });

    const wrap = (original) => function (...args) {
      original.apply(this, args);
      setTimeout(onNav, 0);
    };
    history.pushState    = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  // Inject base styles immediately (document_start) so there's no flash
  injectDynamicStyles();
  applyFlags();

  if (chrome?.storage?.sync) {
    chrome.storage.sync.get(DEFAULTS, (res) => {
      settings = { ...DEFAULTS, ...res };
      applyAll();
      startObservers();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      let changed = false;
      for (const key in changes) {
        if (key in settings) { settings[key] = changes[key].newValue; changed = true; }
      }
      if (changed) applyAll();
    });
  } else {
    applyAll();
    startObservers();
  }
})();
