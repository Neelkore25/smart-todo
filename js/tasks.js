/* ============================================================
   TASKS — list rendering, filtering/sorting, CRUD actions,
   inline editing, and manual drag-and-drop reordering.
   ============================================================ */
import { $, $$ } from './dom.js';
import { state, uid, persistTasks, persistCounter } from './state.js';
import { paintIcons } from './icons.js';
import { toast } from './toast.js';
import { renderStats, isOverdue } from './stats.js';
import { renderCalendar } from './calendar.js';

const taskListEl = $('#taskList');
const emptyStateEl = $('#emptyState');
const emptyTitleEl = $('#emptyTitle');
const emptySubtitleEl = $('#emptySubtitle');
const addForm = $('#addForm');
const taskInput = $('#taskInput');
const addExtra = $('#addExtra');

const priorityRank = { high: 0, med: 1, low: 2 };

function getFilteredSortedTasks(){
  let list = state.tasks.filter(t => {
    if (state.filter === 'active' && t.done) return false;
    if (state.filter === 'completed' && !t.done) return false;
    if (state.categoryFilter !== 'all' && t.category !== state.categoryFilter) return false;
    if (state.calSelectedDate && t.due !== state.calSelectedDate) return false;
    if (state.searchQuery && !t.text.toLowerCase().includes(state.searchQuery.toLowerCase())) return false;
    return true;
  });

  const copy = list.slice();
  switch (state.sortMode){
    case 'oldest': copy.sort((a, b) => a.createdAt - b.createdAt); break;
    case 'alpha': copy.sort((a, b) => a.text.localeCompare(b.text)); break;
    case 'priority': copy.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.createdAt - a.createdAt); break;
    case 'manual': copy.sort((a, b) => a.order - b.order); break;
    default: copy.sort((a, b) => b.createdAt - a.createdAt); // newest
  }
  return copy;
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function catIcon(cat){
  return { Work: 'briefcase', Personal: 'user', Study: 'book-open', Health: 'heart-pulse', Other: 'tag' }[cat] || 'tag';
}

function taskCardHTML(t){
  const overdue = isOverdue(t);
  const dueLabel = t.due ? new Date(t.due + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  return `
  <li class="task-card priority-${t.priority} ${t.done ? 'done' : ''}" data-id="${t.id}" draggable="true">
    <span class="drag-handle" title="Drag to reorder"><i data-lucide="grip-vertical"></i></span>
    <button class="check-btn" data-action="toggle" aria-label="${t.done ? 'Mark incomplete' : 'Mark complete'}">
      <svg viewBox="0 0 24 24"><path d="M4 12 L10 17.5 L20 5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="task-body">
      <div class="task-title-row">
        <span class="task-text" data-action="edit" tabindex="0">${escapeHtml(t.text)}</span>
        ${t.recurring !== 'none' ? `<span class="badge cat" title="Repeats ${t.recurring}"><i data-lucide="repeat"></i>${t.recurring}</span>` : ''}
      </div>
      <div class="task-meta">
        <span class="badge cat"><i data-lucide="${catIcon(t.category)}"></i>${t.category}</span>
        ${dueLabel ? `<span class="badge due ${overdue ? 'overdue' : ''}"><i data-lucide="calendar"></i>${overdue ? 'Overdue · ' : ''}${dueLabel}</span>` : ''}
      </div>
      ${t.notes ? `<div class="task-notes" id="notes-${t.id}">${escapeHtml(t.notes)}</div>` : ''}
    </div>
    <div class="task-actions" data-role="actions">
      ${t.notes ? `<button class="mini-btn" data-action="notes" aria-label="Toggle notes"><i data-lucide="sticky-note"></i></button>` : ''}
      <button class="mini-btn" data-action="delete" aria-label="Delete task"><i data-lucide="trash-2"></i></button>
    </div>
  </li>`;
}

export function renderList(){
  const list = getFilteredSortedTasks();
  taskListEl.innerHTML = list.map(taskCardHTML).join('');
  const noneMatch = list.length === 0;
  emptyStateEl.hidden = !noneMatch;
  if (noneMatch){
    if (state.tasks.length === 0){
      emptyTitleEl.textContent = 'All clear';
      emptySubtitleEl.textContent = 'Add your first task above to get moving.';
    } else if (state.searchQuery){
      emptyTitleEl.textContent = 'No matches';
      emptySubtitleEl.textContent = `Nothing found for "${state.searchQuery}".`;
    } else if (state.filter === 'completed'){
      emptyTitleEl.textContent = 'Nothing completed yet';
      emptySubtitleEl.textContent = 'Finished tasks will show up here.';
    } else {
      emptyTitleEl.textContent = 'Nothing here';
      emptySubtitleEl.textContent = 'Try a different filter or category.';
    }
  }
  paintIcons();
  bindDragAndDrop();
  renderStats();
  renderCalendar();
}

/* ---------- Actions ---------- */
export function addTask(data){
  const t = {
    id: uid(),
    text: data.text,
    notes: data.notes || '',
    priority: data.priority || 'med',
    category: data.category || 'Other',
    due: data.due || '',
    recurring: data.recurring || 'none',
    done: false, doneAt: null,
    createdAt: Date.now(),
    order: state.tasks.length ? Math.max(...state.tasks.map(x => x.order)) + 1 : 0
  };
  state.tasks.push(t);
  persistTasks();
  renderList();
  toast('Task added', { icon: 'plus-circle' });
}

export function toggleDone(id){
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  const wasDone = t.done;
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : null;

  if (t.done && !wasDone){
    state.completedCounter++;
    persistCounter();
    if (t.recurring !== 'none'){
      const base = t.due ? new Date(t.due + 'T00:00') : new Date();
      base.setDate(base.getDate() + (t.recurring === 'daily' ? 1 : 7));
      state.tasks.push({
        ...t, id: uid(), done: false, doneAt: null,
        due: base.toISOString().slice(0, 10),
        createdAt: Date.now(), order: Math.max(...state.tasks.map(x => x.order)) + 1
      });
      toast(`Next "${t.text}" scheduled for ${base.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, { icon: 'repeat' });
    }
  }
  persistTasks();
  renderList();

  state.lastAction = { type: 'toggle', id, prevDone: wasDone };
  toast(t.done ? 'Task completed' : 'Marked as active', {
    icon: t.done ? 'check-circle' : 'undo-2',
    actionLabel: 'Undo',
    onAction: () => { toggleDone(id); }
  });
}

function deleteTaskConfirmed(id){
  const idx = state.tasks.findIndex(x => x.id === id);
  if (idx === -1) return;
  const removed = state.tasks[idx];
  const li = taskListEl.querySelector(`[data-id="${id}"]`);
  if (li) li.classList.add('leaving');
  setTimeout(() => {
    state.tasks = state.tasks.filter(x => x.id !== id);
    persistTasks();
    renderList();
  }, 260);

  toast('Task deleted', {
    icon: 'trash-2',
    actionLabel: 'Undo',
    onAction: () => {
      state.tasks.splice(idx, 0, removed);
      persistTasks();
      renderList();
    }
  });
}

/* ---------- Event delegation: task list ---------- */
taskListEl.addEventListener('click', (e) => {
  const actionBtn = e.target.closest('[data-action]');
  const li = e.target.closest('.task-card');
  if (!li) return;
  const id = li.dataset.id;

  if (!actionBtn) return;
  const action = actionBtn.dataset.action;

  if (action === 'toggle') toggleDone(id);

  else if (action === 'notes'){
    const notesEl = document.getElementById('notes-' + id);
    if (notesEl) notesEl.classList.toggle('open');
  }

  else if (action === 'delete'){
    const actionsEl = li.querySelector('[data-role="actions"]');
    actionsEl.innerHTML = `
      <div class="confirm-delete">
        Delete?
        <button class="yes" type="button">Yes</button>
        <button class="no" type="button">No</button>
      </div>`;
    actionsEl.querySelector('.yes').addEventListener('click', () => deleteTaskConfirmed(id));
    actionsEl.querySelector('.no').addEventListener('click', () => renderList());
  }
});

taskListEl.addEventListener('dblclick', (e) => {
  const span = e.target.closest('.task-text');
  if (!span) return;
  span.contentEditable = 'true';
  span.focus();
  const range = document.createRange();
  range.selectNodeContents(span);
  const sel = window.getSelection();
  sel.removeAllRanges(); sel.addRange(range);
});

taskListEl.addEventListener('keydown', (e) => {
  if (!e.target.classList.contains('task-text')) return;
  if (e.key === 'Enter'){ e.preventDefault(); e.target.blur(); }
  if (e.key === 'Escape'){ e.target.blur(); }
});

taskListEl.addEventListener('focusout', (e) => {
  if (!e.target.classList.contains('task-text') || !e.target.isContentEditable) return;
  const span = e.target;
  span.contentEditable = 'false';
  const li = span.closest('.task-card');
  const t = state.tasks.find(x => x.id === li.dataset.id);
  const val = span.textContent.trim();
  if (val){ t.text = val; persistTasks(); }
  else { span.textContent = t.text; }
});

/* ---------- Drag & drop (manual sort mode) ---------- */
function bindDragAndDrop(){
  let dragEl = null;
  let rafId = null;
  let lastY = 0;

  $$('.task-card').forEach(card => {
    card.addEventListener('dragstart', () => {
      if (state.sortMode !== 'manual'){
        state.sortMode = 'manual';
        const sortSelect = $('#sortSelect');
        if (sortSelect) sortSelect.value = 'manual';
        toast('Sort switched to "Manual" for reordering', { icon: 'info' });
      }
      dragEl = card;
      card.classList.add('dragging');
      taskListEl.classList.add('drag-active');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      taskListEl.classList.remove('drag-active');
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null; dragEl = null;
    });
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!dragEl) return;
      lastY = e.clientY;
      if (rafId) return; // one reorder per frame — avoids layout-thrash jitter
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const after = getDragAfterElement(taskListEl, lastY);
        if (after == null) taskListEl.appendChild(dragEl);
        else taskListEl.insertBefore(dragEl, after);
      });
    });
    card.addEventListener('drop', () => {
      const ids = $$('.task-card').map(c => c.dataset.id);
      ids.forEach((id, i) => { const t = state.tasks.find(x => x.id === id); if (t) t.order = i; });
      persistTasks();
    });
  });
}
function getDragAfterElement(container, y){
  const els = [...container.querySelectorAll('.task-card:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: -Infinity }).element;
}

/* ---------- Add task form ---------- */
export function initTaskForm(){
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    addTask({
      text,
      priority: $('#prioritySelect').value,
      category: $('#categorySelect').value,
      due: $('#dueDateInput').value,
      recurring: $('#recurringSelect').value,
      notes: $('#notesInput').value.trim()
    });
    taskInput.value = '';
    $('#notesInput').value = '';
    $('#dueDateInput').value = '';
    taskInput.focus();
  });

  $('#expandAddBtn').addEventListener('click', () => {
    const willShow = addExtra.hidden;
    addExtra.hidden = !addExtra.hidden;
    $('#expandAddBtn').setAttribute('aria-expanded', String(willShow));
  });
}

/* ---------- Filter / sort / search / category ---------- */
export function initFilters(){
  $$('.filter-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.filter-tabs .tab').forEach(b => b.setAttribute('aria-selected', 'false'));
      $('.filter-tabs .active').classList.remove('active');
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.filter = tab.dataset.filter;
      renderList();
    });
  });
  $('#sortSelect').addEventListener('change', (e) => { state.sortMode = e.target.value; renderList(); });
  $('#categoryFilter').addEventListener('change', (e) => { state.categoryFilter = e.target.value; renderList(); });
  $('#searchInput').addEventListener('input', (e) => { state.searchQuery = e.target.value; renderList(); });
}

/* ---------- Clear completed ---------- */
export function initClearCompleted(){
  $('#clearCompletedBtn').addEventListener('click', () => {
    const removed = state.tasks.filter(t => t.done);
    if (!removed.length){ toast('No completed tasks to clear', { icon: 'info' }); return; }
    state.tasks = state.tasks.filter(t => !t.done);
    persistTasks();
    renderList();
    toast(`Cleared ${removed.length} completed task${removed.length > 1 ? 's' : ''}`, {
      icon: 'trash-2', actionLabel: 'Undo',
      onAction: () => { state.tasks = state.tasks.concat(removed); persistTasks(); renderList(); }
    });
  });
}

/* ---------- Export / import ---------- */
export function initExportImport(){
  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `momentum-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Tasks exported', { icon: 'download' });
  });

  $('#importInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error('bad format');
        const imported = data.map(t => ({
          id: uid(), text: String(t.text || 'Untitled task'), notes: t.notes || '',
          priority: ['low', 'med', 'high'].includes(t.priority) ? t.priority : 'med',
          category: t.category || 'Other', due: t.due || '', recurring: t.recurring || 'none',
          done: !!t.done, doneAt: t.doneAt || null,
          createdAt: t.createdAt || Date.now(),
          order: state.tasks.length ? Math.max(...state.tasks.map(x => x.order)) + 1 : 0
        }));
        state.tasks = state.tasks.concat(imported);
        persistTasks();
        renderList();
        toast(`Imported ${imported.length} task${imported.length > 1 ? 's' : ''}`, { icon: 'upload' });
      }catch(err){
        toast('Import failed — invalid JSON file', { icon: 'alert-triangle' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}
