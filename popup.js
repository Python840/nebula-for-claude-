// popup.js — Nebula for Claude v1.1
'use strict';

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
  customCss:       '',
  animSpeed:       'slow',
};

const LOCAL_BG_KEY      = 'customBgData';
const MAX_FILE_SIZE_MB  = 15;
const MAX_FILE_SIZE_B   = MAX_FILE_SIZE_MB * 1024 * 1024;

document.addEventListener('DOMContentLoaded', () => {

  // ── Element refs ──────────────────────────────────────────────
  const el = (id) => document.getElementById(id);

  const cbEnabled    = el('enabled');
  const cbStars      = el('stars');
  const cbGrid       = el('gridLines');
  const cbGlow       = el('glowAccents');
  const cbFocus      = el('focusMode');
  const cbCompact    = el('compactMode');
  const cbParticles  = el('particles');

  const slOpSidebar  = el('opacitySidebar');
  const slOpChat     = el('opacityChat');
  const slOpInput    = el('opacityInput');
  const slBlur       = el('blur');
  const slBgBlur     = el('bgBlur');

  const valOpSidebar = el('opacitySidebarVal');
  const valOpChat    = el('opacityChatVal');
  const valOpInput   = el('opacityInputVal');
  const valBlur      = el('blurVal');
  const valBgBlur    = el('bgBlurVal');

  const tbBgUrl      = el('bgUrl');
  const fileBg       = el('bgFile');
  const btnClearBg   = el('clearBg');
  const taCss        = el('customCss');

  const elPanel      = el('main-panel');
  const themeSwatches= document.querySelectorAll('.theme-swatch');

  // ── Segmented control helper ──────────────────────────────────
  function initSegControl(containerId, storageKey) {
    const btns = document.querySelectorAll(`#${containerId} .seg-btn`);
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        chrome.storage.sync.set({ [storageKey]: btn.dataset.val });
      });
    });
    return (value) => btns.forEach(b => b.classList.toggle('active', b.dataset.val === value));
  }

  const setAnimSpeed = initSegControl('animSpeed', 'animSpeed');
  const setBgScale   = initSegControl('bgScale',   'bgScale');

  // ── Slider helper ─────────────────────────────────────────────
  function initSlider(slider, valEl, storageKey, suffix = '') {
    slider.addEventListener('input',  () => { valEl.textContent = slider.value + suffix; });
    slider.addEventListener('change', () => chrome.storage.sync.set({ [storageKey]: slider.value }));
    return (value) => { slider.value = value; valEl.textContent = value + suffix; };
  }

  const setOpSidebar = initSlider(slOpSidebar, valOpSidebar, 'opacitySidebar');
  const setOpChat    = initSlider(slOpChat,    valOpChat,    'opacityChat');
  const setOpInput   = initSlider(slOpInput,   valOpInput,   'opacityInput');
  const setBlur      = initSlider(slBlur,      valBlur,      'blur',   'px');
  const setBgBlur    = initSlider(slBgBlur,    valBgBlur,    'bgBlur', 'px');

  // ── Toggle helper ─────────────────────────────────────────────
  function initToggle(checkbox, storageKey) {
    checkbox.addEventListener('change', () => chrome.storage.sync.set({ [storageKey]: checkbox.checked }));
    return (value) => { checkbox.checked = !!value; };
  }

  const setEnabled   = initToggle(cbEnabled,   'enabled');
  const setStars     = initToggle(cbStars,     'stars');
  const setGrid      = initToggle(cbGrid,      'gridLines');
  const setGlow      = initToggle(cbGlow,      'glowAccents');
  const setFocus     = initToggle(cbFocus,     'focusMode');
  const setCompact   = initToggle(cbCompact,   'compactMode');
  const setParticles = initToggle(cbParticles, 'particles');

  // ── Render UI from settings ───────────────────────────────────
  function renderUi(s) {
    setEnabled(s.enabled);
    elPanel.classList.toggle('disabled', !s.enabled);

    // Theme swatches
    themeSwatches.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === s.theme));
    document.documentElement.setAttribute('data-nebula-theme', s.theme);

    // Sliders
    setOpSidebar(s.opacitySidebar);
    setOpChat(s.opacityChat);
    setOpInput(s.opacityInput);
    setBlur(s.blur);
    setBgBlur(s.bgBlur);

    // Toggles
    setStars(s.stars);
    setGrid(s.gridLines);
    setGlow(s.glowAccents);
    setFocus(s.focusMode);
    setCompact(s.compactMode);
    setParticles(s.particles);

    // Segmented controls
    setAnimSpeed(s.animSpeed);
    setBgScale(s.bgScale);

    // Background URL field
    if (s.customBgUrl === '__local__') {
      tbBgUrl.value    = 'Local file active';
      tbBgUrl.disabled = true;
    } else {
      tbBgUrl.value    = s.customBgUrl || '';
      tbBgUrl.disabled = false;
    }

    // Custom CSS
    taCss.value = s.customCss || '';
  }

  // ── Initial load ──────────────────────────────────────────────
  chrome.storage.sync.get(DEFAULTS, (s) => renderUi({ ...DEFAULTS, ...s }));

  // ── Theme swatches ────────────────────────────────────────────
  themeSwatches.forEach(btn => {
    btn.addEventListener('click', () => {
      themeSwatches.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.documentElement.setAttribute('data-nebula-theme', btn.dataset.theme);
      chrome.storage.sync.set({ theme: btn.dataset.theme });
    });
  });

  // ── Power toggle panel dimming ────────────────────────────────
  cbEnabled.addEventListener('change', () => {
    elPanel.classList.toggle('disabled', !cbEnabled.checked);
  });

  // ── Background URL ────────────────────────────────────────────
  tbBgUrl.addEventListener('change', () => {
    const url = tbBgUrl.value.trim();
    if (url !== '__local__') chrome.storage.local.remove(LOCAL_BG_KEY);
    chrome.storage.sync.set({ customBgUrl: url });
  });

  // ── File upload ───────────────────────────────────────────────
  fileBg.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_B) {
      alert(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      fileBg.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      chrome.storage.local.set({ [LOCAL_BG_KEY]: ev.target.result }, () => {
        chrome.storage.sync.set({ customBgUrl: '__local__' });
      });
    };
    reader.readAsDataURL(file);
    fileBg.value = '';
  });

  // ── Clear background ──────────────────────────────────────────
  btnClearBg.addEventListener('click', () => {
    chrome.storage.sync.set({ customBgUrl: '', bgBlur: DEFAULTS.bgBlur, bgScale: DEFAULTS.bgScale });
    chrome.storage.local.remove(LOCAL_BG_KEY);
  });

  // ── Custom CSS ────────────────────────────────────────────────
  let cssDebounce;
  taCss.addEventListener('input', () => {
    clearTimeout(cssDebounce);
    cssDebounce = setTimeout(() => {
      chrome.storage.sync.set({ customCss: taCss.value });
    }, 600);
  });

  // ── External storage changes (e.g. from another tab) ──────────
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      chrome.storage.sync.get(DEFAULTS, (s) => renderUi({ ...DEFAULTS, ...s }));
    }
  });
});
