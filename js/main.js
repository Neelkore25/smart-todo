/* ============================================================
   ORBIT MAIN MODULE — Application entry point.
   Wires all core modules, command palette, shortcuts, and initial render.
   ============================================================ */
import { $ } from './dom.js';
import { paintIcons } from './icons.js';
import { renderList, initTaskForm, initFilters, initClearCompleted, initExportImport } from './tasks.js';
import { initCalendar } from './calendar.js';
import { initPomodoro, initDailyGoal, initVoiceInput, initSuggestions } from './features.js';
import { initShortcuts } from './shortcuts.js';
import { initTheme } from './theme.js';
import { initSettings } from './settings.js';
import { initCommandPalette } from './command-palette.js';

window.paintIcons = paintIcons;

/* Ripple effect on primary interactive buttons */
function initRipple(){
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-primary, .pomo-controls button, .icon-btn, .cmd-palette-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

function initLoader(){
  const reveal = () => {
    const loader = $('#loader');
    const app = $('#app');
    if (loader) loader.classList.add('hidden');
    if (app) app.classList.add('ready');
  };
  window.addEventListener('load', () => setTimeout(reveal, 350));
  setTimeout(reveal, 1000);
}

function init(){
  initTheme();
  initTaskForm();
  initFilters();
  initClearCompleted();
  initExportImport();
  initCalendar(renderList);
  initPomodoro();
  initDailyGoal();
  initVoiceInput();
  initSuggestions();
  initShortcuts();
  initSettings(renderList);
  initCommandPalette(renderList);
  initRipple();
  initLoader();

  renderList();
  paintIcons();
}

init();
