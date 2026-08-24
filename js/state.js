/* State Management & Persistence Engine */
import { safeStorage } from './storage.js';

const TASKS_KEY = 'smarttodo.tasks';
const COUNTER_KEY = 'smarttodo.counter';
const GOAL_KEY = 'smarttodo.goal';

export function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export let taskCounter = safeStorage.get(COUNTER_KEY, 1);

export function uid() {
  const id = 't_' + Date.now() + '_' + taskCounter++;
  safeStorage.set(COUNTER_KEY, taskCounter);
  return id;
}

export const state = {
  tasks: safeStorage.get(TASKS_KEY, []),
  filter: 'all',
  categoryFilter: 'all',
  searchQuery: '',
  sortMode: 'newest',
  calSelectedDate: null,
  calViewYear: new Date().getFullYear(),
  calViewMonth: new Date().getMonth(),
  dailyGoal: safeStorage.get(GOAL_KEY, { target: 3, date: todayISO(), count: 0 })
};

export function nextOrder() {
  if (state.tasks.length === 0) return 1;
  const max = Math.max(...state.tasks.map(t => t.order || 0));
  return max + 1;
}

export function persistTasks() {
  safeStorage.set(TASKS_KEY, state.tasks);
}

export function persistGoal() {
  safeStorage.set(GOAL_KEY, state.dailyGoal);
}
