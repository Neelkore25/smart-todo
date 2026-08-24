/* ============================================================
   TASKS — list rendering, filtering/sorting, CRUD actions,
   inline editing, pointer drag-and-drop, and import/export.
   ============================================================ */
import { $, $$ } from './dom.js';
import { state, uid, persistTasks, nextOrder } from './state.js';
import { paintIcons } from './icons.js';
import { toast } from './toast.js';
import { renderStats, isOverdue } from './stats.js';

const taskListEl = $('#taskList');
const emptyStateEl = $('#emptyState');
const emptyTitleEl = $('#emptyTitle');
const emptySubtitleEl = $('#emptySubtitle');
const addForm = $('#addForm');
const taskInput = $('#taskInput');

const priorityRank = { high: 0, med: 1, low: 2 };

function getFilteredSortedTasks(){
  let list = state.tasks.filter(t => {
    if (state.filter === 'active' && t.done) return false;
    if (state.filter === 'completed' && !t.done) return false;
    if (state.categoryFilter !== 'all' && t.category !== state.categoryFilter) return false;
    if (state.calSelectedDate) {
      if (state.calSelectedDate === 'overdue') {
        if (!isOverdue(t)) return false;
      } else if (t.due !== state.calSelectedDate) {
        return false;
      }
    }
    if (state.searchQuery && !t.text.toLowerCase().includes(state.searchQuery.toLowerCase())) return false;
    return true;
  });

  const copy = list.slice();
  switch (state.sortMode){
    case 'oldest': copy.sort((a, b) => a.createdAt - b.createdAt); break;
    case 'alpha': copy.sort((a, b) => a.text.localeCompare(b.text)); break;
    case 'priority': copy.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.createdAt - a.createdAt); break;
    case 'manual': copy.sort((a, b) => (a.order || 0) - (b.order || 0)); break;
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
  <li class="task-card priority-${t.priority} ${t.done ? 'done' : ''}" data-id="${t.id}">
    <span class="drag-handle" title="Drag to reorder" data-action="drag"><i data-lucide="grip-vertical"></i></span>
    <button class="check-btn" data-action="toggle" aria-label="${t.done ? 'Mark incomplete' : 'Mark complete'}">
      <svg viewBox="0 0 24 24"><path d="M4 12 L10 17.5 L20 5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="task-body">
      <div class="task-title-row">
        <span class="task-text" data-action="edit" tabindex="0">${escapeHtml(t.text)}</span>
        ${t.recurring && t.recurring !== 'none' ? `<span class="badge cat" title="Repeats ${t.recurring}"><i data-lucide="repeat"></i>${t.recurring}</span>` : ''}
      </div>
      <div class="task-meta">
        <span class="badge cat"><i data-lucide="${catIcon(t.category)}"></i>${t.category}</span>
        ${dueLabel ? `<span class="badge due ${overdue ? 'overdue' : ''}"><i data-lucide="calendar"></i>${overdue ? 'Overdue · ' : ''}${dueLabel}</span>` : ''}
      </div>
      ${t.notes ? `<div class="task-notes" id="notes-${t.id}">${escapeHtml(t.notes)}</div>` : ''}
    </div>
    <div class="task-actions" data-role="actions">
      ${t.notes ? `<button class="mini-btn" data-action="notes" aria-label="Toggle notes"><i data-lucide="sticky-note"></i></button>` : ''}
      <button class="mini-btn danger" data-action="delete" aria-label="Delete task"><i data-lucide="trash-2"></i></button>
    </div>
  </li>`;
}

export function renderList(){
  if (!taskListEl) return;
  const list = getFilteredSortedTasks();
  taskListEl.innerHTML = list.map(taskCardHTML).join('');
  const noneMatch = list.length === 0;
  if (emptyStateEl) emptyStateEl.hidden = !noneMatch;
  if (noneMatch && emptyTitleEl){
    if (state.tasks.length === 0){
      emptyTitleEl.textContent = 'Nothing on your list yet';
      emptySubtitleEl.textContent = 'Add a task above to get started.';
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
}

/* ---------- CRUD Actions ---------- */
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
    order: nextOrder()
  };
  state.tasks.unshift(t);
  persistTasks();
  renderList();
  toast('Task added', { icon: 'plus' });
}

export function toggleTask(id){
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  t.doneAt = t.done ? new Date().toISOString() : null;
  persistTasks();
  renderList();
  toast(t.done ? 'Task completed' : 'Task reopened', {
    icon: t.done ? 'check-circle' : 'circle',
    undo: () => toggleTask(id)
  });
}

export function deleteTask(id){
  const idx = state.tasks.findIndex(x => x.id === id);
  if (idx === -1) return;
  const deleted = state.tasks.splice(idx, 1)[0];
  persistTasks();
  renderList();
  toast('Task deleted', {
    icon: 'trash-2',
    undo: () => {
      state.tasks.splice(idx, 0, deleted);
      persistTasks();
      renderList();
    }
  });
}

export function updateTaskText(id, newText){
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.text = newText.trim();
  persistTasks();
  renderList();
}

/* ---------- Task List Event Delegation ---------- */
if (taskListEl) {
  taskListEl.addEventListener('click', (e) => {
    const card = e.target.closest('.task-card');
    if (!card) return;
    const id = card.dataset.id;
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;

    const act = actionBtn.dataset.action;
    if (act === 'toggle') toggleTask(id);
    else if (act === 'delete') deleteTask(id);
    else if (act === 'notes') {
      const notesEl = $('#notes-' + id, card);
      if (notesEl) notesEl.classList.toggle('open');
    }
  });

  taskListEl.addEventListener('dblclick', (e) => {
    const textEl = e.target.closest('.task-text');
    if (!textEl) return;
    const card = textEl.closest('.task-card');
    if (!card) return;
    const id = card.dataset.id;

    textEl.contentEditable = 'true';
    textEl.focus();

    const save = () => {
      textEl.contentEditable = 'false';
      const val = textEl.textContent.trim();
      if (val) updateTaskText(id, val);
      else renderList();
    };

    textEl.addEventListener('blur', save, { once: true });
    textEl.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') { evt.preventDefault(); textEl.blur(); }
      if (evt.key === 'Escape') { textEl.contentEditable = 'false'; renderList(); }
    }, { once: true });
  });
}

/* ---------- Task Form Initialization ---------- */
export function initTaskForm() {
  if (!addForm) return;
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    const priority = $('#prioritySelect').value;
    const category = $('#categorySelect').value;
    const due = $('#dueDateInput').value;
    const recurring = $('#recurringSelect').value;
    const notes = $('#notesInput').value.trim();

    addTask({ text, priority, category, due, recurring, notes });

    taskInput.value = '';
    $('#notesInput').value = '';
    $('#dueDateInput').value = '';
    taskInput.focus();
  });
}

/* ---------- Toolbar Filters & Sorting ---------- */
export function initFilters() {
  const searchInput = $('#searchInput');
  const filterTabs = $$('.filter-tabs .tab');
  const sortSelect = $('#sortSelect');
  const categoryFilter = $('#categoryFilter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderList();
    });
  }

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filter = tab.dataset.filter;
      renderList();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortMode = e.target.value;
      renderList();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      state.categoryFilter = e.target.value;
      renderList();
    });
  }
}

export function initClearCompleted() {
  const btn = $('#clearCompletedBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const completed = state.tasks.filter(t => t.done);
    if (completed.length === 0) {
      toast('No completed tasks to clear', { icon: 'info' });
      return;
    }
    state.tasks = state.tasks.filter(t => !t.done);
    persistTasks();
    renderList();
    toast(`Cleared ${completed.length} completed task(s)`, { icon: 'trash-2' });
  });
}

export function initExportImport() {
  const exportBtn = $('#exportBtn');
  const importInput = $('#importInput');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `orbit_tasks_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      toast('Tasks exported to JSON', { icon: 'download' });
    });
  }

  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (Array.isArray(parsed)) {
            state.tasks = parsed;
            persistTasks();
            renderList();
            toast('Tasks imported successfully!', { icon: 'upload' });
          } else {
            throw new Error('Invalid format');
          }
        } catch (err) {
          toast('Failed to import JSON file.', { icon: 'alert-triangle' });
        }
      };
      reader.readAsText(file);
    });
  }
}

/* ---------- Pointer Events Drag and Drop Engine ---------- */
function bindDragAndDrop() {
  if (!taskListEl) return;
  const cards = $$('.task-card', taskListEl);
  cards.forEach(card => {
    const handle = card.querySelector('.drag-handle');
    if (!handle) return;

    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();

      card.classList.add('dragging-ghost');
      const rect = card.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;

      card.style.position = 'fixed';
      card.style.width = rect.width + 'px';
      card.style.top = (e.clientY - offsetY) + 'px';
      card.style.left = rect.left + 'px';
      card.style.zIndex = '9999';

      const placeholder = document.createElement('li');
      placeholder.className = 'task-card placeholder';
      placeholder.style.height = rect.height + 'px';
      card.parentNode.insertBefore(placeholder, card);

      const onPointerMove = (evt) => {
        card.style.top = (evt.clientY - offsetY) + 'px';
        const siblings = $$('.task-card:not(.dragging-ghost):not(.placeholder)', taskListEl);
        let nextSibling = siblings.find(sib => {
          const r = sib.getBoundingClientRect();
          return evt.clientY < r.top + r.height / 2;
        });
        if (nextSibling) {
          taskListEl.insertBefore(placeholder, nextSibling);
        } else {
          taskListEl.appendChild(placeholder);
        }
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        card.classList.remove('dragging-ghost');
        card.style.position = '';
        card.style.width = '';
        card.style.top = '';
        card.style.left = '';
        card.style.zIndex = '';

        placeholder.parentNode.insertBefore(card, placeholder);
        placeholder.remove();

        // Update orders in state
        const updatedCards = $$('.task-card', taskListEl);
        updatedCards.forEach((el, index) => {
          const id = el.dataset.id;
          const t = state.tasks.find(x => x.id === id);
          if (t) t.order = index + 1;
        });
        state.sortMode = 'manual';
        const sortSel = $('#sortSelect');
        if (sortSel) sortSel.value = 'manual';
        persistTasks();
        toast('Task order updated', { icon: 'grip-vertical' });
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    });
  });
}
