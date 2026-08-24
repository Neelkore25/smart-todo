/* ============================================================
   COMMAND PALETTE MODULE (Cmd+K / Ctrl+K)
   Provides an instant command bar for power users to search tasks,
   switch filters, toggle themes, and trigger application actions.
   ============================================================ */
import { $, $$ } from './dom.js';
import { state } from './state.js';
import { setTheme } from './theme.js';
import { toast } from './toast.js';

export function initCommandPalette(onRenderTasks) {
  const paletteModal = $('#commandPaletteModal');
  const paletteInput = $('#paletteSearchInput');
  const paletteList = $('#paletteResultsList');
  const openBtn = $('#commandPaletteTriggerBtn');
  const closeBtn = $('#closePaletteBtn');

  if (!paletteModal || !paletteInput || !paletteList) return;

  const COMMANDS = [
    { id: 'new-task', label: 'Create new task', category: 'Actions', icon: 'plus', action: () => { $('#taskInput').focus(); } },
    { id: 'filter-all', label: 'Show all tasks', category: 'Filters', icon: 'check-check', action: () => { triggerFilter('all'); } },
    { id: 'filter-active', label: 'Show active tasks', category: 'Filters', icon: 'circle', action: () => { triggerFilter('active'); } },
    { id: 'filter-completed', label: 'Show completed tasks', category: 'Filters', icon: 'check-circle', action: () => { triggerFilter('completed'); } },
    { id: 'theme-dark', label: 'Switch to Dark Mode', category: 'Appearance', icon: 'moon', action: () => { setTheme('dark'); toast('Theme: Dark', { icon: 'moon' }); } },
    { id: 'theme-light', label: 'Switch to Light Mode', category: 'Appearance', icon: 'sun', action: () => { setTheme('light'); toast('Theme: Light', { icon: 'sun' }); } },
    { id: 'theme-auto', label: 'Switch to System Auto Theme', category: 'Appearance', icon: 'sun-moon', action: () => { setTheme('auto'); toast('Theme: Auto', { icon: 'sun-moon' }); } },
    { id: 'open-settings', label: 'Open App Preferences / Settings', category: 'Preferences', icon: 'settings', action: () => { $('#settingsToggleBtn').click(); } }
  ];

  function triggerFilter(filter) {
    state.filter = filter;
    $$('.filter-tabs .tab').forEach(t => {
      const active = t.dataset.filter === filter;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });
    onRenderTasks && onRenderTasks();
  }

  function openPalette() {
    paletteModal.hidden = false;
    paletteInput.value = '';
    renderResults('');
    paletteInput.focus();
  }

  function closePalette() {
    paletteModal.hidden = true;
  }

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    let matches = [];

    // Match static commands
    COMMANDS.forEach(cmd => {
      if (!q || cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)) {
        matches.push({ type: 'command', ...cmd });
      }
    });

    // Match task items
    if (q && state.tasks) {
      state.tasks.forEach(t => {
        if (t.text.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q))) {
          matches.push({
            type: 'task',
            id: t.id,
            label: `Task: ${t.text}`,
            category: 'Tasks',
            icon: t.done ? 'check-circle' : 'circle',
            action: () => {
              state.searchQuery = t.text;
              const searchInput = $('#searchInput');
              if (searchInput) searchInput.value = t.text;
              onRenderTasks && onRenderTasks();
            }
          });
        }
      });
    }

    if (matches.length === 0) {
      paletteList.innerHTML = `<div class="palette-empty">No results found for "${q}"</div>`;
      return;
    }

    let html = '';
    matches.forEach((item, index) => {
      html += `
        <button type="button" class="palette-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
          <span class="palette-item-icon"><i data-lucide="${item.icon}"></i></span>
          <span class="palette-item-label">${escapeHtml(item.label)}</span>
          <span class="palette-item-cat">${item.category}</span>
        </button>`;
    });

    paletteList.innerHTML = html;
    if (window.paintIcons) window.paintIcons();

    // Bind item clicks
    $$('.palette-item', paletteList).forEach((el, idx) => {
      el.addEventListener('click', () => {
        const item = matches[idx];
        if (item && item.action) {
          closePalette();
          item.action();
        }
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  paletteInput.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });

  if (openBtn) openBtn.addEventListener('click', openPalette);
  if (closeBtn) closeBtn.addEventListener('click', closePalette);

  paletteModal.addEventListener('click', (e) => {
    if (e.target === paletteModal) closePalette();
  });

  // Global Keyboard Trigger (Cmd+K or Ctrl+K)
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (paletteModal.hidden) openPalette();
      else closePalette();
    }
  });
}
