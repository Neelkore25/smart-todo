/* ============================================================
   THEME MODULE — Deterministic Dark / Light / Auto Theme Switching
   Persisted in localStorage under 'smarttodo.theme'.
   ============================================================ */
import { $ } from './dom.js';
import { safeStorage } from './storage.js';
import { ICONS } from './icons.js';

const ORDER = ['dark', 'light', 'auto'];

const META = {
  dark: { icon: 'sun', title: 'Switch to Light mode' },
  light: { icon: 'moon', title: 'Switch to Dark mode' },
  auto: { icon: 'sun-moon', title: 'Theme: System Auto' }
};

let currentThemeMode = 'dark';

function apply(mode) {
  document.documentElement.setAttribute('data-theme', mode);

  const btn = $('#themeToggle');
  if (btn) {
    btn.title = META[mode].title;
    btn.setAttribute('aria-label', META[mode].title);
    const svg = btn.querySelector('svg');
    if (svg && ICONS[META[mode].icon]) {
      svg.innerHTML = ICONS[META[mode].icon];
    }
  }

  // Also sync settings select if available
  const settingSelect = $('#settingThemeSelect');
  if (settingSelect && settingSelect.value !== mode) {
    settingSelect.value = mode;
  }

  // Update theme-color meta tag
  const isLight =
    mode === 'light' ||
    (mode === 'auto' && window.matchMedia('(prefers-color-scheme: light)').matches);

  const meta = $('#themeColorMeta');
  if (meta) {
    meta.setAttribute('content', isLight ? '#F5F7FA' : '#080B10');
  }
}

export function getTheme() {
  return currentThemeMode;
}

export function setTheme(mode) {
  if (!ORDER.includes(mode)) mode = 'dark';
  currentThemeMode = mode;
  safeStorage.set('smarttodo.theme', mode);
  apply(mode);
}

export function initTheme() {
  let mode = safeStorage.get('smarttodo.theme', 'dark');
  if (!ORDER.includes(mode)) mode = 'dark';
  currentThemeMode = mode;

  apply(mode);

  const toggleBtn = $('#themeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const nextIndex = (ORDER.indexOf(currentThemeMode) + 1) % ORDER.length;
      setTheme(ORDER[nextIndex]);
    });
  }

  // Listen for OS color scheme changes if set to auto
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (currentThemeMode === 'auto') {
      apply('auto');
    }
  });
}