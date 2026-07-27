/* ============================================================
   TOASTS + CONFETTI
   ============================================================ */
import { $ } from './dom.js';
import { paintIcons } from './icons.js';

const toastContainer = $('#toastContainer');
const confettiLayer = $('#confettiLayer');

export function toast(message, { icon = 'check-circle', actionLabel = null, onAction = null, timeout = 4200 } = {}){
  const el = document.createElement('div');
  el.className = 'toast';
  const iconEl = document.createElement('i');
  iconEl.setAttribute('data-lucide', icon);
  const textEl = document.createElement('span');
  textEl.style.flex = '1';
  textEl.textContent = message; // always plain text, never parsed as HTML
  el.append(iconEl, textEl);
  if (actionLabel){
    const btn = document.createElement('button');
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => { onAction && onAction(); remove(); });
    el.appendChild(btn);
  }
  toastContainer.appendChild(el);
  paintIcons();
  const timer = setTimeout(remove, timeout);
  function remove(){
    clearTimeout(timer);
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 260);
  }
}

export function fireConfetti(){
  const colors = ['#7C5CFF', '#00C2FF', '#34D399', '#FFB454', '#FB6B7C'];
  for (let i = 0; i < 70; i++){
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const size = 6 + Math.random() * 6;
    p.style.width = size + 'px';
    p.style.height = (size * 0.4) + 'px';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (2.4 + Math.random() * 1.6) + 's';
    p.style.opacity = String(0.8 + Math.random() * 0.2);
    confettiLayer.appendChild(p);
    setTimeout(() => p.remove(), 4200);
  }
}
