/* Stats Summary, Productivity Streak & Achievements Badges System */
import { $ } from './dom.js';
import { state, todayISO } from './state.js';
import { ICONS } from './icons.js';

export function isOverdue(t) {
  if (!t.due || t.done) return false;
  return t.due < todayISO();
}

export function renderStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  const active = total - done;
  const overdueCount = state.tasks.filter(t => isOverdue(t)).length;

  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const fill = $('#progressFill');
  const label = $('#progressLabel');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${pct}% complete (${done}/${total})`;

  const pills = $('#statsPills');
  if (pills) {
    pills.innerHTML = `
      <div class="stat-pill"><b>${total}</b> Total</div>
      <div class="stat-pill"><b>${active}</b> Active</div>
      <div class="stat-pill"><b>${done}</b> Done</div>
      ${overdueCount > 0 ? `<div class="stat-pill" style="color:var(--danger);border-color:rgba(248,113,113,0.3);"><b style="color:var(--danger);">${overdueCount}</b> Overdue</div>` : ''}
    `;
  }

  renderStreakWidget();
  renderAchievements(done);
}

function renderStreakWidget() {
  const streakDaysEl = $('#streakDays');
  const weekCompletedEl = $('#weekCompleted');

  if (!streakDaysEl || !weekCompletedEl) return;

  // Calculate tasks completed this week (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekDoneCount = state.tasks.filter(t => {
    if (!t.done || !t.doneAt) return false;
    const d = new Date(t.doneAt);
    return d >= sevenDaysAgo;
  }).length;

  weekCompletedEl.textContent = `${weekDoneCount} task${weekDoneCount === 1 ? '' : 's'}`;

  // Simple active streak calculation based on unique completion dates
  const dates = new Set();
  state.tasks.forEach(t => {
    if (t.done && t.doneAt) {
      dates.add(t.doneAt.slice(0, 10));
    }
  });

  const streak = dates.size > 0 ? dates.size : 1;
  streakDaysEl.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
}

function renderAchievements(doneCount) {
  const badgesRow = $('#badgesRow');
  if (!badgesRow) return;

  const BADGES = [
    { id: 'first', title: 'First Step', desc: 'Complete 1 task', icon: 'zap', min: 1 },
    { id: 'five', title: 'High Five', desc: 'Complete 5 tasks', icon: 'flame', min: 5 },
    { id: 'ten', title: 'Productivity Pro', desc: 'Complete 10 tasks', icon: 'award', min: 10 },
    { id: 'master', title: 'Task Master', desc: 'Complete 25 tasks', icon: 'trophy', min: 25 }
  ];

  let html = '';
  BADGES.forEach(b => {
    const unlocked = doneCount >= b.min;
    const iconSvg = ICONS[b.icon] ? `<svg viewBox="0 0 24 24">${ICONS[b.icon]}</svg>` : '';
    html += `
      <div class="achievement ${unlocked ? 'unlocked' : ''}">
        ${iconSvg}
        <span class="tip"><b>${b.title}</b><br/>${b.desc}</span>
      </div>
    `;
  });
  badgesRow.innerHTML = html;
}
