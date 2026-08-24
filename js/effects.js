/* Audio Synthesis & Visual Effects Engine (Web Audio API & Confetti Burst) */
import { safeStorage } from './storage.js';

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSound(type) {
  try {
    const soundEnabled = safeStorage.get('smarttodo.settings', {}).soundEnabled !== false;
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'complete') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      osc.start(now);
      osc.stop(now + 0.20);
    } else if (type === 'reopen') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'delete') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'goal' || type === 'achievement') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.10); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.20); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.30); // C6
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (e) {
    // Silent fallback if audio is blocked
  }
}

export function fireConfetti(targetEl, options = {}) {
  const count = options.count || 24;
  const container = document.getElementById('confettiLayer') || document.body;

  let originX = window.innerWidth / 2;
  let originY = window.innerHeight / 2;

  if (targetEl && targetEl.getBoundingClientRect) {
    const rect = targetEl.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
  }

  const colors = ['#00D4FF', '#38BDF8', '#34D399', '#FBBF24', '#A855F7', '#EC4899'];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.floor(Math.random() * 6) + 6;
    const dx = (Math.random() - 0.5) * 220;
    const dy = (Math.random() - 0.7) * 180;
    const rot = (Math.random() - 0.5) * 720;

    piece.style.left = originX + 'px';
    piece.style.top = originY + 'px';
    piece.style.width = size + 'px';
    piece.style.height = size + 'px';
    piece.style.backgroundColor = color;
    piece.style.setProperty('--dx', dx + 'px');
    piece.style.setProperty('--dy', dy + 'px');
    piece.style.setProperty('--rot', rot + 'deg');

    container.appendChild(piece);
    setTimeout(() => piece.remove(), 1000);
  }
}
