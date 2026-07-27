/* ============================================================
   THEME — cycles auto → light → dark, persisted in storage.
   'auto' follows the OS via prefers-color-scheme (see tokens.css).
   ============================================================ */
import { $ } from './dom.js';
import { safeStorage } from './storage.js';
import { ICONS } from './icons.js';

const ORDER = ['auto', 'light', 'dark'];

const META = {
  auto: { icon: 'sun-moon', title: 'Theme: auto' },
  light: { icon: 'sun', title: 'Theme: light' },
  dark: { icon: 'moon', title: 'Theme: dark' },
};

function apply(mode) {
  document.documentElement.setAttribute('data-theme', mode);

  const btn = $('#themeToggle');
  if (!btn) return;

  btn.title = META[mode].title;
  btn.setAttribute('aria-label', META[mode].title);

  // Fast icon update (no DOM rebuild)
  const svg = btn.querySelector('svg');
  if (svg && ICONS[META[mode].icon]) {
    svg.innerHTML = ICONS[META[mode].icon];
  }

  // Update browser theme color
  const isLight =
    mode === 'light' ||
    (mode === 'auto' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const meta = $('#themeColorMeta');
  if (meta) {
    meta.setAttribute('content', isLight ? '#F3F3F7' : '#09090B');
  }
}

export function initTheme() {
  let mode = safeStorage.get('momentum.theme', 'auto');
  if (!ORDER.includes(mode)) mode = 'auto';

  apply(mode);

  $('#themeToggle').addEventListener('click', () => {
    mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    safeStorage.set('momentum.theme', mode);
    apply(mode);
  });
}