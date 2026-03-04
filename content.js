// content.js — Nebula for Claude v1.1.1
(() => {
  const BG_ID        = 'nebula-bg';
  const STYLE_ID     = 'nebula-dynamic-styles';
  const CSS_ID       = 'nebula-custom-css';
  const HTML_CLASS   = 'nebula-active';
  const LOCAL_BG_KEY = 'customBgData';

  const DEFAULTS = {
    enabled:         true,
    theme:           'void',
    opacitySidebar:  '75',
    opacityChat:     '40',
    opacityInput:    '85',
    blur:            '20',
    customBgUrl:     '',
    bgBlur:          '60',
    bgScale:         'cover',
    stars:           true,
    gridLines:       false,
    glowAccents:     true,
    focusMode:       false,
    compactMode:     false,
    particles:       false,
    composerStyle:   'glass',   // glass | neon | default
    customCss:       '',
    animSpeed:       'slow',
  };

  const THEMES = {
    void:   { base: '#020817', grad1: '0, 180, 255',   grad2: '80, 30, 180',   grad3: '0, 80, 200',    accent: '#06b6d4', glow: '0, 200, 255'   },
    nebula: { base: '#05020f', grad1: '120, 40, 220',  grad2: '20, 80, 200',   grad3: '180, 20, 140',  accent: '#a855f7', glow: '168, 85, 247'  },
    neon:   { base: '#010a10', grad1: '0, 230, 255',   grad2: '0, 80, 255',    grad3: '0, 200, 180',   accent: '#00e5ff', glow: '0, 229, 255'   },
    mono:   { base: '#0a0a0f', grad1: '60, 60, 90',    grad2: '30, 30, 60',    grad3: '80, 80, 120',   accent: '#6366f1', glow: '99, 102, 241'  },
  };

  let settings = { ...DEFAULTS };

  // ── Star field (deterministic LCG) ────────────────────────────────────────
  function generateStarShadows(count) {
    const shadows = [];
    let seed = 42;
    const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
    for (let i = 0; i < count; i++) {
      const x = (rand() * 4000).toFixed(0), y = (rand() * 2400).toFixed(0);
      const size = rand() > 0.93 ? 2 : 1, op = (0.2 + rand() * 0.7).toFixed(2);
      const r = Math.floor(200 + rand() * 55), g = Math.floor(200 + rand() * 55), b = Math.floor(220 + rand() * 35);
      shadows.push(`${x}px ${y}px 0 ${size}px rgba(${r},${g},${b},${op})`);
    }
    return shadows.join(',');
  }
  const STAR_SHADOWS_SM = generateStarShadows(400);
  const STAR_SHADOWS_LG = generateStarShadows(80);

  // ── CSS variables on <html> inline style (works at document_start) ────────
  // This is the key fix: inline styles on <html> are available immediately to
  // styles.css, unlike a <style> tag which may land outside <head> at doc_start.
  function applyInlineVars() {
    const t   = THEMES[settings.theme] || THEMES.void;
    const s   = settings;
    const html = document.documentElement;
    const spd  = { slow: '28s', medium: '14s', off: '0s' }[s.animSpeed] || '28s';

    html.style.setProperty('--nebula-base',       t.base);
    html.style.setProperty('--nebula-grad1',      t.grad1);
    html.style.setProperty('--nebula-grad2',      t.grad2);
    html.style.setProperty('--nebula-grad3',      t.grad3);
    html.style.setProperty('--nebula-accent',     t.accent);
    html.style.setProperty('--nebula-glow',       t.glow);
    html.style.setProperty('--nebula-op-sidebar', (parseInt(s.opacitySidebar || '75') / 100).toFixed(2));
    html.style.setProperty('--nebula-op-chat',    (parseInt(s.opacityChat    || '40') / 100).toFixed(2));
    html.style.setProperty('--nebula-op-input',   (parseInt(s.opacityInput   || '85') / 100).toFixed(2));
    html.style.setProperty('--nebula-blur',       `${s.blur    || '20'}px`);
    html.style.setProperty('--nebula-bg-blur',    `${s.bgBlur  || '60'}px`);
    html.style.setProperty('--nebula-anim-speed', spd);
  }

  // ── <style> tag for box-shadows + object-fit (needs <head>) ──────────────
  function injectComplexStyles() {
    const target = document.head || document.documentElement;
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      target.appendChild(el);
      // Move into <head> once it's ready if we had to use <html>
      if (!document.head) {
        document.addEventListener('DOMContentLoaded', () => {
          if (el.parentNode !== document.head) document.head.appendChild(el);
        }, { once: true });
      }
    }
    el.textContent = `
      .nebula-stars-sm { box-shadow: ${STAR_SHADOWS_SM}; }
      .nebula-stars-lg { box-shadow: ${STAR_SHADOWS_LG}; }
      .nebula-bg-img, .nebula-bg-video { object-fit: ${settings.bgScale || 'cover'} !important; }
    `;
  }

  // ── Custom CSS ─────────────────────────────────────────────────────────────
  function injectCustomCss() {
    const target = document.head || document.documentElement;
    if (!target) return;
    let el = document.getElementById(CSS_ID);
    if (!el) { el = document.createElement('style'); el.id = CSS_ID; target.appendChild(el); }
    el.textContent = settings.customCss || '';
  }

  // ── Background node ────────────────────────────────────────────────────────
  function makeBgNode() {
    const wrap = document.createElement('div');
    wrap.id = BG_ID;
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = `
      <div class="nebula-gradient"></div>
      <img  class="nebula-bg-img"   alt="" aria-hidden="true" style="display:none">
      <video class="nebula-bg-video" playsinline autoplay muted loop style="display:none"></video>
      <div class="nebula-particles"></div>
      <div class="nebula-stars-sm"></div>
      <div class="nebula-stars-lg"></div>
      <div class="nebula-grid"></div>
      <div class="nebula-vignette"></div>
    `;
    return wrap;
  }

  function showBg() {
    if (document.getElementById(BG_ID)) return;
    const node = makeBgNode();
    const attach = () => document.body.prepend(node);
    if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach, { once: true });
  }
  function hideBg() { document.getElementById(BG_ID)?.remove(); }

  // ── Background media ───────────────────────────────────────────────────────
  const VIDEO_EXTS = ['.mp4', '.webm', '.ogv', '.ogg'];
  function updateBackgroundMedia() {
    const bgNode = document.getElementById(BG_ID);
    if (!bgNode) return;
    const img = bgNode.querySelector('.nebula-bg-img'), video = bgNode.querySelector('.nebula-bg-video');
    if (!img || !video) return;

    const applyMedia = (url) => {
      const isVideo = VIDEO_EXTS.some(e => url.toLowerCase().includes(e)) || url.startsWith('data:video');
      bgNode.classList.add('nebula-custom-bg');
      if (isVideo) { video.src = url; video.style.display = 'block'; img.style.display = 'none'; img.src = ''; }
      else          { img.src = url;  img.style.display = 'block';  video.style.display = 'none'; video.src = ''; }
    };
    const clearMedia = () => {
      bgNode.classList.remove('nebula-custom-bg');
      img.style.display = 'none'; img.src = ''; video.style.display = 'none'; video.src = '';
    };

    const url = settings.customBgUrl;
    if (!url) { clearMedia(); }
    else if (url === '__local__') {
      if (!chrome?.storage?.local) { clearMedia(); return; }
      chrome.storage.local.get(LOCAL_BG_KEY, (res) => {
        (!chrome.runtime.lastError && res[LOCAL_BG_KEY]) ? applyMedia(res[LOCAL_BG_KEY]) : clearMedia();
      });
    } else { applyMedia(url); }
  }

  // ── Particles ──────────────────────────────────────────────────────────────
  function manageParticles() {
    const container = document.getElementById(BG_ID)?.querySelector('.nebula-particles');
    if (!container) return;
    if (!settings.particles) { container.innerHTML = ''; return; }
    if (container.children.length > 0) return;
    for (let i = 0; i < 28; i++) {
      const s = document.createElement('span');
      s.style.cssText = `--px:${Math.random()*100}%;--dur:${8+Math.random()*16}s;--del:${-(Math.random()*18)}s;--dx:${(Math.random()-.5)*80}px;--sz:${1+Math.random()*2}px;--op:${(.3+Math.random()*.5).toFixed(2)}`;
      container.appendChild(s);
    }
  }

  // ── Glassmorphism: JS-based panel detection ────────────────────────────────
  // This complements CSS — catches elements the CSS selectors miss by using
  // semantic roles and structure rather than class names.
  function applyGlass() {
    if (!settings.enabled || !document.body) return;
    const blurPx    = parseInt(settings.blur || '20');
    const blur      = `blur(${blurPx}px)`;
    const rawSidebar = parseInt(settings.opacitySidebar || '75') / 100;
    const rawInput   = parseInt(settings.opacityInput   || '85') / 100;
    // When panel blur is active, enforce a minimum opacity so frost is visible
    // even over already-blurred or smooth gradient backgrounds
    const minFrost  = blurPx > 0 ? 0.12 : 0;
    const opSidebar = Math.max(rawSidebar, minFrost).toFixed(2);
    const opInput   = Math.max(rawInput,   minFrost).toFixed(2);

    // Semantic structural elements: definitely present in any modern web app
    const sidebarEls = document.querySelectorAll(
      'nav, aside, [role="navigation"], [role="complementary"]'
    );
    sidebarEls.forEach(el => {
      if (el.closest('#' + BG_ID)) return;
      el.style.setProperty('background-color', `rgba(2,8,23,${opSidebar})`, 'important');
      el.style.setProperty('backdrop-filter',          blur, 'important');
      el.style.setProperty('-webkit-backdrop-filter',  blur, 'important');
    });

    // Header
    document.querySelectorAll('header, [role="banner"]').forEach(el => {
      if (el.closest('#' + BG_ID)) return;
      el.style.setProperty('background-color', `rgba(2,8,23,${opSidebar})`, 'important');
      el.style.setProperty('backdrop-filter',          blur, 'important');
      el.style.setProperty('-webkit-backdrop-filter',  blur, 'important');
    });

    // Main content
    document.querySelectorAll('main, [role="main"]').forEach(el => {
      if (el.closest('#' + BG_ID)) return;
      el.style.setProperty('background-color', 'transparent', 'important');
    });

    // Composer / input area
    applyComposerStyle();

    // Compact mode direct application
    applyCompact();
  }

  function applyComposerStyle() {
    if (!settings.enabled) return;
    const blur   = `blur(${settings.blur || '20'}px)`;
    const opInput = (parseInt(settings.opacityInput || '85') / 100).toFixed(2);
    const style  = settings.composerStyle || 'glass';

    const inputs = document.querySelectorAll('[contenteditable="true"], textarea, [role="textbox"]');
    inputs.forEach(inp => {
      if (inp.closest('#' + BG_ID)) return;
      // Walk up to find the outermost composer container
      // Stop when the element gets taller than 60% of viewport (we've gone too far)
      let container = inp;
      for (let el = inp.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        const rect = el.getBoundingClientRect();
        if (rect.height > window.innerHeight * 0.6) break;
        container = el;
      }

      if (style === 'default') {
        // Remove our overrides
        container.style.removeProperty('background-color');
        container.style.removeProperty('backdrop-filter');
        container.style.removeProperty('-webkit-backdrop-filter');
        container.style.removeProperty('border');
        container.style.removeProperty('box-shadow');
        return;
      }
      if (style === 'glass') {
        container.style.setProperty('background-color', `rgba(5,15,35,${opInput})`, 'important');
        container.style.setProperty('backdrop-filter',          blur, 'important');
        container.style.setProperty('-webkit-backdrop-filter',  blur, 'important');
        container.style.setProperty('border', '1px solid rgba(var(--nebula-grad1),0.18)', 'important');
      }
      if (style === 'neon') {
        container.style.setProperty('background-color', `rgba(var(--nebula-grad1),0.06)`, 'important');
        container.style.setProperty('backdrop-filter',          blur, 'important');
        container.style.setProperty('-webkit-backdrop-filter',  blur, 'important');
        container.style.setProperty('border', '1px solid rgba(var(--nebula-grad1),0.45)', 'important');
        container.style.setProperty('box-shadow', '0 0 20px rgba(var(--nebula-glow),0.18)', 'important');
      }
    });
  }

  // ── Compact mode: direct JS targeting (CSS selectors may not match) ────────
  function applyCompact() {
    if (!settings.enabled) return;
    const on = !!settings.compactMode;
    document.querySelectorAll('[data-testid*="turn"], article, [role="article"]').forEach(el => {
      if (el.closest('#' + BG_ID)) return;
      if (on) {
        el.style.setProperty('padding-top',    '6px', 'important');
        el.style.setProperty('padding-bottom', '6px', 'important');
        el.style.setProperty('margin-bottom',  '4px', 'important');
      } else {
        el.style.removeProperty('padding-top');
        el.style.removeProperty('padding-bottom');
        el.style.removeProperty('margin-bottom');
      }
    });
  }

  // ── Flags + direct element control ────────────────────────────────────────
  function applyFlags() {
    const html = document.documentElement;
    html.classList.toggle(HTML_CLASS,            !!settings.enabled);
    html.classList.toggle('nebula-grid-on',      !!settings.enabled && !!settings.gridLines);
    html.classList.toggle('nebula-focus',        !!settings.enabled && !!settings.focusMode);
    html.classList.toggle('nebula-glow-on',      !!settings.enabled && !!settings.glowAccents);
    html.classList.toggle('nebula-compact',      !!settings.enabled && !!settings.compactMode);
    html.classList.toggle('nebula-particles-on', !!settings.enabled && !!settings.particles);
    html.setAttribute('data-nebula-theme', settings.theme || 'void');

    // Stars: use display to defeat the starTwinkle animation (which overrides opacity)
    const bgNode = document.getElementById(BG_ID);
    if (bgNode) {
      const showStars = !!settings.enabled && !!settings.stars;
      const sm = bgNode.querySelector('.nebula-stars-sm');
      const lg = bgNode.querySelector('.nebula-stars-lg');
      if (sm) sm.style.display = showStars ? 'block' : 'none';
      if (lg) lg.style.display = showStars ? 'block' : 'none';
    }
  }

  // ── Master apply ───────────────────────────────────────────────────────────
  function applyAll() {
    applyInlineVars();
    injectComplexStyles();
    applyFlags();
    if (settings.enabled) showBg(); else hideBg();
    updateBackgroundMedia();
    injectCustomCss();
    manageParticles();
    // JS-based glass: run after DOM is settled
    if (document.body) applyGlass();
    else document.addEventListener('DOMContentLoaded', applyGlass, { once: true });
  }

  // ── Keyboard shortcut: Alt+Shift+N ────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
      e.preventDefault();
      if (chrome?.storage?.sync) chrome.storage.sync.set({ enabled: !settings.enabled });
    }
  });

  // ── Observers ─────────────────────────────────────────────────────────────
  let observersStarted = false;
  function startObservers() {
    if (observersStarted) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', startObservers, { once: true }); return; }
    observersStarted = true;

    // Re-inject bg if React removes it
    new MutationObserver(() => {
      if (settings.enabled && !document.getElementById(BG_ID)) {
        document.body.prepend(makeBgNode());
        applyFlags(); updateBackgroundMedia(); manageParticles();
      }
    }).observe(document.body, { childList: true });

    // Re-inject styles if head hydration strips them
    if (document.head) {
      new MutationObserver(() => {
        if (!document.getElementById(STYLE_ID)) injectComplexStyles();
        if (!document.getElementById(CSS_ID) && settings.customCss) injectCustomCss();
      }).observe(document.head, { childList: true });
    }

    // Re-apply glass when React re-renders DOM
    let glassTimer;
    new MutationObserver(() => {
      clearTimeout(glassTimer);
      glassTimer = setTimeout(applyGlass, 300);
    }).observe(document.body, { childList: true, subtree: true });

    // SPA navigation
    let lastHref = location.href;
    const onNav = () => { if (location.href !== lastHref) { lastHref = location.href; applyAll(); } };
    window.addEventListener('popstate', onNav, { passive: true });
    const wrap = (fn) => function (...args) { fn.apply(this, args); setTimeout(onNav, 0); };
    history.pushState    = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  // Step 1: Immediately set CSS vars + class (works before page renders)
  applyInlineVars();
  document.documentElement.classList.add(HTML_CLASS);

  // Step 2: Load user settings, then apply everything
  if (chrome?.storage?.sync) {
    chrome.storage.sync.get(DEFAULTS, (res) => {
      settings = { ...DEFAULTS, ...res };
      applyAll();
      startObservers();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        let changed = false;
        for (const key in changes) { if (key in settings) { settings[key] = changes[key].newValue; changed = true; } }
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
