/* Features Module: Pomodoro Timer, Daily Goal, Voice Dictation & Task Suggestions */
import { $ } from './dom.js';
import { state, persistGoal, todayISO } from './state.js';
import { toast } from './toast.js';

/* Safe helper for checking doneAt date string */
function getDoneAtString(t) {
  if (!t || !t.doneAt) return '';
  if (typeof t.doneAt === 'string') return t.doneAt;
  if (typeof t.doneAt === 'number') {
    try {
      return new Date(t.doneAt).toISOString();
    } catch(e) {
      return '';
    }
  }
  return String(t.doneAt);
}

/* ---------- Pomodoro Focus Session ---------- */
let pomoTimer = null;
let pomoSeconds = 25 * 60;
let pomoRunning = false;
let pomoModeState = 'focus'; // 'focus' | 'break'

export function initPomodoro() {
  const display = $('#pomoDisplay');
  const startBtn = $('#pomoStart');
  const resetBtn = $('#pomoReset');
  const modeLabel = $('#pomoMode');

  if (!display || !startBtn) return;

  function updateDisplay() {
    const m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
    const s = String(pomoSeconds % 60).padStart(2, '0');
    display.textContent = `${m}:${s}`;

    if (modeLabel) {
      if (state.activeTaskForPomo) {
        modeLabel.textContent = `${pomoModeState === 'focus' ? 'Focusing on:' : 'Break for:'} ${state.activeTaskForPomo.text}`;
      } else {
        modeLabel.textContent = pomoModeState === 'focus' ? 'Focus session (25m)' : 'Break session (5m)';
      }
    }
  }

  function tick() {
    if (pomoSeconds > 0) {
      pomoSeconds--;
      updateDisplay();
    } else {
      clearInterval(pomoTimer);
      pomoRunning = false;
      startBtn.textContent = 'Start';
      if (pomoModeState === 'focus') {
        pomoModeState = 'break';
        pomoSeconds = 5 * 60;
        toast('Focus session completed! Take a 5-minute break.', { icon: 'award' });
      } else {
        pomoModeState = 'focus';
        pomoSeconds = 25 * 60;
        toast('Break finished! Ready for another focus session?', { icon: 'zap' });
      }
      updateDisplay();
    }
  }

  startBtn.addEventListener('click', () => {
    if (pomoRunning) {
      clearInterval(pomoTimer);
      pomoRunning = false;
      startBtn.textContent = 'Start';
    } else {
      pomoRunning = true;
      startBtn.textContent = 'Pause';
      pomoTimer = setInterval(tick, 1000);
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearInterval(pomoTimer);
      pomoRunning = false;
      pomoModeState = 'focus';
      pomoSeconds = 25 * 60;
      state.activeTaskForPomo = null;
      startBtn.textContent = 'Start';
      updateDisplay();
    });
  }

  updateDisplay();
}

/* ---------- Daily Goal Ring Tracker ---------- */
export function initDailyGoal() {
  const goalCountEl = $('#goalCount');
  const goalRing = $('#goalRingFill');
  const goalInput = $('#goalInput');
  const goalSaveBtn = $('#goalSaveBtn');

  if (!goalCountEl) return;

  if (state.dailyGoal.date !== todayISO()) {
    state.dailyGoal.date = todayISO();
    state.dailyGoal.count = 0;
    persistGoal();
  }

  function updateGoalUI() {
    const todayStr = todayISO();
    const todayDone = state.tasks.filter(t => t.done && typeof t.doneAt === 'string' && t.doneAt.startsWith(todayStr)).length;
    state.dailyGoal.count = todayDone;
    persistGoal();

    const target = state.dailyGoal.target || 3;
    goalCountEl.textContent = `${todayDone} / ${target}`;

    if (goalRing) {
      const circumference = 169.6;
      const ratio = Math.min(todayDone / target, 1);
      const offset = circumference - ratio * circumference;
      goalRing.style.strokeDashoffset = offset;
    }
  }

  if (goalInput) goalInput.value = state.dailyGoal.target || 3;

  if (goalSaveBtn && goalInput) {
    goalSaveBtn.addEventListener('click', () => {
      const val = parseInt(goalInput.value, 10);
      if (val && val > 0 && val <= 50) {
        state.dailyGoal.target = val;
        persistGoal();
        updateGoalUI();
        toast(`Daily goal updated to ${val} tasks`, { icon: 'target' });
      }
    });
  }

  updateGoalUI();
}

/* ---------- Voice Input (Web Speech API) ---------- */
export function initVoiceInput() {
  const micBtn = $('#micBtn');
  const taskInput = $('#taskInput');
  if (!micBtn || !taskInput) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.style.display = 'none';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let listening = false;

  micBtn.addEventListener('click', () => {
    if (listening) {
      recognition.stop();
      listening = false;
      micBtn.classList.remove('active');
    } else {
      try {
        recognition.start();
        listening = true;
        micBtn.classList.add('active');
        toast('Listening… Dictate your task', { icon: 'mic' });
      } catch (e) {
        listening = false;
        micBtn.classList.remove('active');
      }
    }
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript) {
      taskInput.value = transcript;
      taskInput.focus();
      toast('Voice task captured', { icon: 'check' });
    }
    listening = false;
    micBtn.classList.remove('active');
  };

  recognition.onerror = () => {
    listening = false;
    micBtn.classList.remove('active');
  };
}

/* ---------- AI Task Suggestions ---------- */
const SUGGESTIONS = [
  "Review quarterly key performance metrics",
  "Design landing page hero section concept",
  "Refactor task storage schema and migration pipeline",
  "Prepare slides for Friday team showcase",
  "Schedule weekly 1-on-1 sync with lead architect",
  "Optimize database query performance and indexes",
  "Audit design tokens and color accessibility contrast"
];

export function initSuggestions() {
  const aiBtn = $('#aiSuggestBtn');
  const taskInput = $('#taskInput');
  if (!aiBtn || !taskInput) return;

  aiBtn.addEventListener('click', () => {
    const rand = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
    taskInput.value = rand;
    taskInput.focus();
    toast('Task suggestion generated', { icon: 'sparkles' });
  });
}
