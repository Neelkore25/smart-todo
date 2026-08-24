/* ============================================================
   EFFECTS MODULE — Sound feedback & confetti celebrations.
   Fixes two dead features: the "Audio & Toast Feedback" setting
   toggle previously had zero effect, and the #confettiLayer
   element in the DOM was never used by any code.
   ============================================================ */
import { $ } from './dom.js';
import { getSetting } from './settings.js';

let audioCtx = null;
function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

/* Tiny, tasteful tones — never harsh, never long. Respects the
   "Audio & Toast Feedback" setting in Preferences. */
export function playSound(kind = 'tick') {
  if (getSetting('soundEnabled') === false) return;
  const c = ctx();
  if (!c) return;

  const presets = {
    complete: [{ f: 740, t: 0, d: 0.09 }, { f: 988, t: 0.07, d: 0.12 }],
    reopen:   [{ f: 392, t: 0, d: 0.1 }],
    delete:   [{ f: 300, t: 0, d: 0.08 }],
    achievement: [{ f: 523, t: 0, d: 0.09 }, { f: 659, t: 0.08, d: 0.09 }, { f: 784, t: 0.16, d: 0.18 }],
    goal: [{ f: 587, t: 0, d: 0.1 }, { f: 880, t: 0.09, d: 0.16 }],
    tick: [{ f: 620, t: 0, d: 0.05 }]
  };
  const notes = presets[kind] || presets.tick;

  notes.forEach(n => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = n.f;
    const start = c.currentTime + n.t;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.11, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + n.d + 0.02);
  });
}

const CONFETTI_COLORS = ['#00D4FF', '#0088FF', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

/* Fires a burst of small DOM particles from a given origin point (or the
   center of the viewport if omitted). Deliberately lightweight — no
   canvas, no external libs — and respects prefers-reduced-motion. */
export function fireConfetti(originEl, opts = {}) {
  const layer = $('#confettiLayer');
  if (!layer) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  if (originEl && originEl.getBoundingClientRect) {
    const r = originEl.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  }

  const count = opts.count || 22;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece';
    const angle = (Math.random() * Math.PI * 2);
    const dist = 60 + Math.random() * 120;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 40;
    const rot = (Math.random() * 720 - 360) + 'deg';
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = 5 + Math.random() * 5;

    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.width = size + 'px';
    p.style.height = size * (Math.random() > 0.5 ? 1 : 2.2) + 'px';
    p.style.background = color;
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');
    p.style.setProperty('--rot', rot);
    p.style.animationDelay = (Math.random() * 0.05) + 's';

    layer.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
    setTimeout(() => p.remove(), 1400);
  }
}
