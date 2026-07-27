/* ============================================================
   STATS + PROGRESS + DAILY GOAL + ACHIEVEMENTS
   ============================================================ */
import { $ } from './dom.js';
import { state, isSameDay } from './state.js';
import { paintIcons } from './icons.js';
import { toast, fireConfetti } from './toast.js';

const statsPillsEl = $('#statsPills');
const progressFillEl = $('#progressFill');
const progressLabelEl = $('#progressLabel');
const goalLabelEl = $('#goalLabel');

export function isOverdue(t){
  return t.due && !t.done && t.due < new Date().toISOString().slice(0, 10);
}

const ACHIEVEMENTS = [
  { id: 'first', label: 'First step — complete 1 task', icon: 'star', threshold: 1 },
  { id: 'ten', label: 'Getting things done — complete 10 tasks', icon: 'flame', threshold: 10 },
  { id: 'twentyfive', label: 'Task master — complete 25 tasks', icon: 'trophy', threshold: 25 },
  { id: 'fifty', label: 'Unstoppable — complete 50 tasks', icon: 'crown', threshold: 50 },
];

function renderBadges(){
  const row = $('#badgesRow');
  row.innerHTML = ACHIEVEMENTS.map(a => `
    <div class="achievement ${state.completedCounter >= a.threshold ? 'unlocked' : ''}">
      <i data-lucide="${a.icon}"></i>
      <span class="tip">${a.label}</span>
    </div>
  `).join('');
  paintIcons();
}

export function renderStats(){
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.done).length;
  const pending = total - completed;
  const overdue = state.tasks.filter(isOverdue).length;

  statsPillsEl.innerHTML = `
    <span class="pill"><b>${total}</b>&nbsp;total</span>
    <span class="pill"><b>${pending}</b>&nbsp;pending</span>
    <span class="pill"><b>${completed}</b>&nbsp;done</span>
    <span class="pill ${overdue ? 'overdue' : ''}"><b>${overdue}</b>&nbsp;overdue</span>
  `;

  const pct = total ? Math.round((completed / total) * 100) : 0;
  progressFillEl.style.width = pct + '%';
  progressLabelEl.textContent = pct + '% complete';

  if (total > 0 && pct === 100 && !state.confettiFired){
    state.confettiFired = true;
    fireConfetti();
    toast('All tasks complete — nice work!', { icon: 'party-popper' });
  }
  if (pct < 100) state.confettiFired = false;

  // daily goal ring
  const doneToday = state.tasks.filter(t => t.done && t.doneAt && isSameDay(new Date(t.doneAt).toISOString())).length;
  const ratio = Math.min(1, doneToday / Math.max(1, state.dailyGoal));
  const circumference = 169.6;
  $('#goalRingFill').style.strokeDashoffset = String(circumference * (1 - ratio));
  $('#goalCount').textContent = `${doneToday} / ${state.dailyGoal}`;
  goalLabelEl.textContent = doneToday >= state.dailyGoal ? '🎯 Daily goal reached' : '';

  renderBadges();
}
