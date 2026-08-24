/* Keyboard Shortcuts Handler */
import { $, $$ } from './dom.js';

export function initShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Ignore when user is typing inside input, textarea, or contenteditable
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement.isContentEditable) {
      if (e.key === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      const taskInput = $('#taskInput');
      if (taskInput) taskInput.focus();
    } else if (e.key === '/') {
      e.preventDefault();
      const searchInput = $('#searchInput');
      if (searchInput) searchInput.focus();
    } else if (e.key === 'Escape') {
      const activeModal = $$('.modal-backdrop:not([hidden])')[0];
      if (activeModal) {
        activeModal.hidden = true;
      }
    }
  });
}
