/* ============================================================
   STATE — single source of truth for the whole app.
   Every module reads/writes through this object so there is
   exactly one copy of the data in memory.
   ============================================================ */
import { safeStorage } from './storage.js';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const isSameDay = (iso) => iso && iso.slice(0, 10) === todayISO();

const seedTasks = [
  { id: uid(), text: 'Kick off the Q3 roadmap deck', notes: 'Focus on the top 3 priorities only.', priority: 'high', category: 'Work', due: todayISO(), recurring: 'none', done: false, doneAt: null, createdAt: Date.now() - 3000, order: 0 },
  { id: uid(), text: 'Morning run', notes: '', priority: 'med', category: 'Health', due: '', recurring: 'daily', done: false, doneAt: null, createdAt: Date.now() - 2000, order: 1 },
  { id: uid(), text: 'Read one chapter of current book', notes: '', priority: 'low', category: 'Personal', due: '', recurring: 'none', done: true, doneAt: Date.now() - 1000, createdAt: Date.now() - 4000, order: 2 },
];

export const state = {
  tasks: safeStorage.get('momentum.tasks', seedTasks),
  completedCounter: safeStorage.get('momentum.completedCounter', 1),
  dailyGoal: safeStorage.get('momentum.dailyGoal', 3),

  filter: 'all',
  sortMode: 'newest',
  categoryFilter: 'all',
  searchQuery: '',
  calendarVisible: false,
  calCursor: new Date(),
  calSelectedDate: null,
  confettiFired: false,
  lastAction: null, // { type, id, ... }
};

export function persistTasks(){ safeStorage.set('momentum.tasks', state.tasks); }
export function persistCounter(){ safeStorage.set('momentum.completedCounter', state.completedCounter); }
export function persistGoal(){ safeStorage.set('momentum.dailyGoal', state.dailyGoal); }
