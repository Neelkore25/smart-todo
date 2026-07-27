/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */
import { $ } from './dom.js';
import { state } from './state.js';
import { toggleDone } from './tasks.js';

export function initShortcuts(){
  const taskInput = $('#taskInput');
  const searchInput = $('#searchInput');

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

    if (e.key === 'Escape'){
      if (typing) e.target.blur();
      return;
    }
    if (typing) return;

    if (e.key === 'n'){ e.preventDefault(); taskInput.focus(); }
    else if (e.key === '/'){ e.preventDefault(); searchInput.focus(); }
    else if (e.key === 'u' && state.lastAction){ toggleDone(state.lastAction.id); }
  });
}
