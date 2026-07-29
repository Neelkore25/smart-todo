/* ============================================================
   POMODORO · DAILY GOAL · VOICE INPUT · TASK SUGGESTION (demo)
   ============================================================ */
import { $ } from './dom.js';
import { state, persistGoal } from './state.js';
import { toast } from './toast.js';
import { renderStats } from './stats.js';

/* ---------- Pomodoro timer ---------- */
export function initPomodoro(){
  const FOCUS = 25 * 60, BREAK = 5 * 60;
  let remaining = FOCUS, mode = 'focus', running = false, timerId = null;
  const display = $('#pomoDisplay'), modeLabel = $('#pomoMode'), startBtn = $('#pomoStart'), resetBtn = $('#pomoReset');

  function paint(){
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    display.textContent = `${m}:${s}`;
    modeLabel.textContent = mode === 'focus' ? 'Focus session' : 'Break time';
  }
  function tick(){
    remaining--;
    if (remaining <= 0){
      mode = mode === 'focus' ? 'break' : 'focus';
      remaining = mode === 'focus' ? FOCUS : BREAK;
      toast(mode === 'focus' ? "Break's over — back to focus" : 'Nice work — take a break', { icon: 'timer' });
    }
    paint();
  }
  startBtn.addEventListener('click', () => {
    running = !running;
    startBtn.textContent = running ? 'Pause' : 'Start';
    if (running) timerId = setInterval(tick, 1000);
    else clearInterval(timerId);
  });
  resetBtn.addEventListener('click', () => {
    clearInterval(timerId); running = false; mode = 'focus'; remaining = FOCUS;
    startBtn.textContent = 'Start'; paint();
  });
  paint();
}

/* ---------- Daily goal ---------- */
export function initDailyGoal(){
  $('#goalSaveBtn').addEventListener('click', () => {
    const val = parseInt($('#goalInput').value, 10);
    if (!val || val < 1){ toast('Enter a goal of 1 or more', { icon: 'alert-triangle' }); return; }
    state.dailyGoal = val;
    persistGoal();
    $('#goalInput').value = '';
    renderStats();
    toast('Daily goal updated', { icon: 'target' });
  });
}

/* ---------- Voice input (Web Speech API) ---------- */
export function initVoiceInput(){
  const micBtn = $('#micBtn');
  const taskInput = $('#taskInput');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition){
    micBtn.title = 'Voice input not supported in this browser';
    micBtn.style.opacity = '0.4';
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  let listening = false;

  micBtn.addEventListener('click', () => {
    if (listening){ recognition.stop(); return; }
    try{ recognition.start(); }catch(e){ /* already started */ }
  });
  recognition.addEventListener('start', () => { listening = true; micBtn.classList.add('active'); });
  recognition.addEventListener('end', () => { listening = false; micBtn.classList.remove('active'); });
  recognition.addEventListener('result', (e) => {
    const transcript = e.results[0][0].transcript;
    taskInput.value = (taskInput.value ? taskInput.value + ' ' : '') + transcript;
    taskInput.focus();
  });
  recognition.addEventListener('error', () => { toast('Voice input error — try again', { icon: 'alert-triangle' }); });
}

/* ---------- Task suggestion (Smart AI Task Generator) ---------- */
const SUGGESTIONS = {
  Work: [
    'Prepare slides for tomorrow\'s roadmap presentation',
    'Review pending code pull requests & documentation',
    'Follow up with client on deliverables & feedback',
    'Organize weekly sprint goals & prioritize tickets',
    'Clean up project backlog and archive obsolete tasks'
  ],
  Personal: [
    'Plan weekend errands & grocery checklist',
    'Call family or catch up with a close friend',
    'Organize digital workspace and clean up downloads folder',
    'Set up automated monthly bill payments',
    'Schedule upcoming routine health appointment'
  ],
  Study: [
    'Review core concepts & practice flashcards for 20 mins',
    'Summarize key takeaways from today\'s lecture notes',
    'Read chapter section and write 3 summary bullets',
    'Solve 2 practice problem sets on target module',
    'Outline research paper structure and gathering sources'
  ],
  Health: [
    'Drink a large glass of water & take a hydration break',
    'Take a invigorating 15-minute outdoor walk',
    'Do a 5-minute full body stretch & posture check',
    'Prep a nutritious meal for tomorrow\'s lunch',
    'Unplug from screens 30 minutes before sleep'
  ],
  Other: [
    'Back up important local files to secure storage',
    'Declutter desk workspace & clear physical notes',
    'Water indoor plants and check lighting',
    'Review weekly personal goals and progress',
    'Spend 15 minutes practicing a creative hobby'
  ]
};

export function initSuggestions(){
  const suggestBtn = $('#aiSuggestBtn');
  if (!suggestBtn) return;

  suggestBtn.addEventListener('click', (e) => {
    // Category awareness
    const catSelect = $('#categorySelect');
    const cat = catSelect ? catSelect.value : 'Other';
    const pool = SUGGESTIONS[cat] || SUGGESTIONS.Other;
    
    // Pick random suggestion different from current value
    const taskInput = $('#taskInput');
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (taskInput.value && pool.length > 1) {
      while (pick === taskInput.value) {
        pick = pool[Math.floor(Math.random() * pool.length)];
      }
    }

    taskInput.value = pick;
    taskInput.focus();

    // Visual Sparkle Particles Effect
    createSparkleParticles(suggestBtn);

    toast(`AI Suggestion: "${pick.slice(0, 30)}..."`, { icon: 'sparkles' });
  });
}

function createSparkleParticles(btn) {
  const rect = btn.getBoundingClientRect();
  const colors = ['#8B5CF6', '#06B6D4', '#34D399', '#F59E0B', '#F43F5E'];
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.className = 'sparkle-particle';
    const size = 4 + Math.random() * 6;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.borderRadius = '50%';
    particle.style.position = 'fixed';
    particle.style.zIndex = '9999';
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + rect.height / 2}px`;
    particle.style.pointerEvents = 'none';

    const angle = Math.random() * Math.PI * 2;
    const distance = 25 + Math.random() * 35;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
    ], {
      duration: 500 + Math.random() * 300,
      easing: 'cubic-bezier(0, .9, .57, 1)',
      fill: 'forwards'
    });

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}
