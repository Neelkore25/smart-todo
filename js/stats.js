/* Stats Summary, Productivity Streak & Achievements Badges System */
import { $ } from './dom.js';
import { state, todayISO } from './state.js';
import { ICONS } from './icons.js';
import { safeStorage } from './storage.js';
import { playSound, fireConfetti } from './effects.js';

const UNLOCKED_KEY = 'smarttodo.unlockedBadges';

function getDoneAtString(t) {
  if (!t.doneAt) return '';
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

function toDateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Real "current streak": walks backward day by day from today, counting
   consecutive days that had at least one completed task. If nothing was
   completed today yet, the streak can still continue from yesterday so an
   in-progress day doesn't zero it out prematurely. */
function computeConsecutiveStreak(dateSet) {
  if (!dateSet || dateSet.size === 0) return 0;
  const cursor = new Date();
  if (!dateSet.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (dateSet.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

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

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekDoneCount = state.tasks.filter(t => {
    if (!t.done || !t.doneAt) return false;
    const str = getDoneAtString(t);
    if (!str) return false;
    const d = new Date(str);
    return d >= sevenDaysAgo;
  }).length;

  weekCompletedEl.textContent = `${weekDoneCount} task${weekDoneCount === 1 ? '' : 's'}`;

  const dates = new Set();
  state.tasks.forEach(t => {
    if (t.done && t.doneAt) {
      const str = getDoneAtString(t);
      if (str && str.length >= 10) {
        dates.add(str.slice(0, 10));
      }
    }
  });

  const streak = computeConsecutiveStreak(dates);
  streakDaysEl.textContent = streak > 0 ? `${streak} day${streak === 1 ? '' : 's'}` : '0 days';
  streakDaysEl.closest('.streak-box')?.classList.toggle('streak-hot', streak >= 3);
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

  let firstRun = false;
  try { firstRun = localStorage.getItem(UNLOCKED_KEY) === null; } catch (e) {}

  const previouslyUnlocked = new Set(safeStorage.get(UNLOCKED_KEY, []));
  const newlyUnlocked = [];

  let html = '';
  BADGES.forEach(b => {
    const unlocked = doneCount >= b.min;
    if (unlocked && !previouslyUnlocked.has(b.id)) newlyUnlocked.push(b);
    if (unlocked) previouslyUnlocked.add(b.id);

    const iconSvg = ICONS[b.icon] ? `<svg viewBox="0 0 24 24">${ICONS[b.icon]}</svg>` : '';
    html += `
      <div class="achievement ${unlocked ? 'unlocked' : ''}" data-badge="${b.id}">
        ${iconSvg}
        <span class="tip"><b>${b.title}</b><br/>${b.desc}</span>
      </div>
    `;
  });
  badgesRow.innerHTML = html;

  if (newlyUnlocked.length > 0) {
    safeStorage.set(UNLOCKED_KEY, [...previouslyUnlocked]);
    if (!firstRun) newlyUnlocked.forEach(b => {
      const el = badgesRow.querySelector(`[data-badge="${b.id}"]`);
      fireConfetti(el, { count: 34 });
      playSound('achievement');
    });
  }
}
