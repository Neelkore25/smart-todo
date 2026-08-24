/* Toast Notifications & Micro-Feedback */
import { $ } from './dom.js';
import { ICONS } from './icons.js';

export function toast(message, opts = {}) {
  const container = $('#toastContainer');
  if (!container) return;

  const t = document.createElement('div');
  t.className = 'toast';

  const iconName = opts.icon || 'info';
  const iconSvg = ICONS[iconName] ? `<svg viewBox="0 0 24 24">${ICONS[iconName]}</svg>` : '';

  let html = `${iconSvg}<span>${message}</span>`;
  if (opts.undo) {
    html += `<button type="button" class="undo-btn">Undo</button>`;
  }

  t.innerHTML = html;

  if (opts.undo) {
    const undoBtn = t.querySelector('.undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        opts.undo();
        t.remove();
      });
    }
  }

  container.appendChild(t);

  setTimeout(() => {
    t.classList.add('leaving');
    setTimeout(() => t.remove(), 250);
  }, opts.duration || 3200);
}
