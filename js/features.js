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

/* ---------- Task suggestion (mock / demo — no external API) ---------- */
const SUGGESTIONS = {
  Work: ['Prepare slides for tomorrow\'s meeting', 'Reply to pending emails', 'Review the project roadmap', 'Follow up with the client'],
  Personal: ['Call a friend you haven\'t spoken to in a while', 'Plan the weekend errands', 'Tidy up the inbox'],
  Study: ['Review flashcards for 20 minutes', 'Read one chapter of the textbook', 'Summarize today\'s lecture notes'],
  Health: ['Drink a glass of water', 'Take a 10-minute walk', 'Stretch for 5 minutes', 'Prep a healthy lunch'],
  Other: ['Back up important files', 'Declutter one drawer', 'Water the plants']
};
export function initSuggestions(){
  $('#aiSuggestBtn').addEventListener('click', () => {
    const cat = $('#categorySelect').value || 'Other';
    const pool = SUGGESTIONS[cat] || SUGGESTIONS.Other;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const taskInput = $('#taskInput');
    taskInput.value = pick;
    taskInput.focus();
    toast('Suggestion added', { icon: 'sparkles' });
  });
}
