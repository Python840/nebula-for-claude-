// popup.js — Nebula for Claude settings panel
'use strict';

const DEFAULTS = {
  enabled:      true,
  theme:        'void',
  panelOpacity: '75',
  blur:         '20',
  stars:        true,
  gridLines:    false,
  focusMode:    false,
  glowAccents:  true,
  animSpeed:    'slow',
};

document.addEventListener('DOMContentLoaded', () => {

  // ── Element refs ──────────────────────────────────────────────
  const elEnabled      = document.getElementById('enabled');
  const elOpacity      = document.getElementById('panelOpacity');
  const elOpacityVal   = document.getElementById('panelOpacityVal');
  const elBlur         = document.getElementById('blur');
  const elBlurVal      = document.getElementById('blurVal');
  const elStars        = document.getElementById('stars');
  const elGrid         = document.getElementById('gridLines');
  const elFocus        = document.getElementById('focusMode');
  const elGlow         = document.getElementById('glowAccents');
  const elPanel        = document.getElementById('main-panel');
  const elThemeSwatches= document.querySelectorAll('.theme-swatch');
  const elSegBtns      = document.querySelectorAll('#animSpeed .seg-btn');

  // ── Apply loaded settings to UI ───────────────────────────────
  function renderUi(s) {
    elEnabled.checked    = !!s.enabled;
    elOpacity.value      = s.panelOpacity;
    elOpacityVal.textContent = s.panelOpacity;
    elBlur.value         = s.blur;
    elBlurVal.textContent = `${s.blur}px`;
    elStars.checked      = !!s.stars;
    elGrid.checked       = !!s.gridLines;
    elFocus.checked      = !!s.focusMode;
    elGlow.checked       = !!s.glowAccents;

    // Theme swatches
    elThemeSwatches.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === s.theme);
    });

    // Segmented control
    elSegBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === s.animSpeed);
    });

    // Panel dimmed when disabled
    elPanel.classList.toggle('disabled', !s.enabled);

    // Sync popup's own theme preview
    document.documentElement.setAttribute('data-nebula-theme', s.theme);
  }

  // ── Save a single key ─────────────────────────────────────────
  function save(key, value) {
    chrome.storage.sync.set({ [key]: value });
  }

  // ── Initial load ──────────────────────────────────────────────
  chrome.storage.sync.get(DEFAULTS, (s) => {
    renderUi({ ...DEFAULTS, ...s });
  });

  // ── Event listeners ───────────────────────────────────────────

  elEnabled.addEventListener('change', () => save('enabled', elEnabled.checked));

  elOpacity.addEventListener('input', () => {
    elOpacityVal.textContent = elOpacity.value;
  });
  elOpacity.addEventListener('change', () => save('panelOpacity', elOpacity.value));

  elBlur.addEventListener('input', () => {
    elBlurVal.textContent = `${elBlur.value}px`;
  });
  elBlur.addEventListener('change', () => save('blur', elBlur.value));

  elStars.addEventListener('change',   () => save('stars',       elStars.checked));
  elGrid.addEventListener('change',    () => save('gridLines',   elGrid.checked));
  elFocus.addEventListener('change',   () => save('focusMode',   elFocus.checked));
  elGlow.addEventListener('change',    () => save('glowAccents', elGlow.checked));

  elThemeSwatches.forEach(btn => {
    btn.addEventListener('click', () => {
      elThemeSwatches.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.documentElement.setAttribute('data-nebula-theme', btn.dataset.theme);
      save('theme', btn.dataset.theme);
    });
  });

  elSegBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elSegBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      save('animSpeed', btn.dataset.val);
    });
  });

  // Reflect external changes (e.g. changed from another tab)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    chrome.storage.sync.get(DEFAULTS, (s) => renderUi({ ...DEFAULTS, ...s }));
  });
});
