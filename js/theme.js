/* ============================================================
   THEME — cycles auto → light → dark, persisted in storage.
   'auto' follows the OS via prefers-color-scheme (see tokens.css).
   ============================================================ */
import { $ } from './dom.js';
import { safeStorage } from './storage.js';
import { paintIcons } from './icons.js';

const ORDER = ['auto', 'light', 'dark'];
const META = {
  auto: { icon: 'sun-moon', title: 'Theme: auto' },
  light: { icon: 'sun', title: 'Theme: light' },
  dark: { icon: 'moon', title: 'Theme: dark' },
};

function apply(mode){
  document.documentElement.setAttribute('data-theme', mode);
  const btn = $('#themeToggle');
  const icon = btn.querySelector('i, svg');
  if (icon) icon.outerHTML = `<i data-lucide="${META[mode].icon}"></i>`;
  btn.title = META[mode].title;
  btn.setAttribute('aria-label', META[mode].title);
  paintIcons();
}

export function initTheme(){
  let mode = safeStorage.get('momentum.theme', 'auto');
  if (!ORDER.includes(mode)) mode = 'auto';
  apply(mode);

  $('#themeToggle').addEventListener('click', () => {
    mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    safeStorage.set('momentum.theme', mode);
    apply(mode);
  });
}
