/* ============================================================
   CALENDAR MODULE — Interactive Visual Monthly Calendar Grid
   & Quick Date Filter Presets.
   Sets state.calSelectedDate (ISO date string or 'overdue')
   used by tasks.js to filter the task list.
   ============================================================ */
import { $, $$ } from './dom.js';
import { state, todayISO } from './state.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

let calCurrentView = new Date(); // Month currently displayed in grid

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
}

function updateTriggerLabel() {
  const toggleBtn = $('#datePickerToggle');
  const labelEl = $('#dateFilterLabel');
  const badgeEl = $('#dateFilterActiveBadge');

  if (!labelEl || !toggleBtn) return;

  if (!state.calSelectedDate) {
    labelEl.textContent = 'Calendar';
    toggleBtn.classList.remove('active');
    if (badgeEl) badgeEl.hidden = true;
  } else if (state.calSelectedDate === 'overdue') {
    labelEl.textContent = 'Overdue';
    toggleBtn.classList.add('active');
    if (badgeEl) badgeEl.hidden = false;
  } else if (state.calSelectedDate === todayISO()) {
    labelEl.textContent = 'Today';
    toggleBtn.classList.add('active');
    if (badgeEl) badgeEl.hidden = false;
  } else {
    const d = new Date(state.calSelectedDate + 'T00:00');
    labelEl.textContent = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    toggleBtn.classList.add('active');
    if (badgeEl) badgeEl.hidden = false;
  }
}

function renderVisualCalendarGrid(onChange) {
  const gridContainer = $('#calGridDays');
  const monthYearLabel = $('#calMonthYearLabel');
  if (!gridContainer || !monthYearLabel) return;

  const year = calCurrentView.getFullYear();
  const month = calCurrentView.getMonth();

  monthYearLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  // Collect tasks due dates set for dot indicators
  const taskDueDates = new Set(state.tasks.map(t => t.due).filter(Boolean));

  let html = '';

  // Day headers (Sun - Sat)
  const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  html += `<div class="cal-week-header">` +
    dayHeaders.map(d => `<span class="cal-week-day">${d}</span>`).join('') +
    `</div><div class="cal-days-grid">`;

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const prevDayNum = daysInPrevMonth - i;
    html += `<button type="button" class="cal-day-cell other-month" disabled>${prevDayNum}</button>`;
  }

  const todayStr = todayISO();

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const isSelected = state.calSelectedDate === dateStr;
    const hasTasks = taskDueDates.has(dateStr);

    let classes = 'cal-day-cell';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';
    if (hasTasks) classes += ' has-tasks';

    html += `<button type="button" class="${classes}" data-date="${dateStr}">${day}</button>`;
  }

  // Next month leading days padding to complete 6 rows (42 cells total)
  const totalCellsSoFar = firstDay + daysInMonth;
  const remainingCells = (42 - totalCellsSoFar) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    html += `<button type="button" class="cal-day-cell other-month" disabled>${day}</button>`;
  }

  html += `</div>`;
  gridContainer.innerHTML = html;

  // Bind day cell click handlers
  $$('.cal-day-cell[data-date]', gridContainer).forEach(cell => {
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      state.calSelectedDate = cell.dataset.date;
      updateTriggerLabel();
      renderVisualCalendarGrid(onChange);
      closePopover();
      onChange && onChange();
    });
  });
}

function positionPopover() {
  const toggleBtn = $('#datePickerToggle');
  const popover = $('#datePopover');
  if (!toggleBtn || !popover) return;

  const btnRect = toggleBtn.getBoundingClientRect();
  const gap = 10;
  const vw = window.innerWidth, vh = window.innerHeight;

  popover.style.left = '0px';
  popover.style.top = '0px';
  const pw = popover.offsetWidth || 300;
  const ph = popover.offsetHeight || 380;

  let left = btnRect.right - pw;
  let top = btnRect.bottom + gap;

  left = Math.min(Math.max(left, 12), vw - pw - 12);
  if (top + ph > vh - 12) top = btnRect.top - ph - gap;

  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

function closePopover() {
  const toggleBtn = $('#datePickerToggle');
  const popover = $('#datePopover');
  if (!popover) return;
  popover.hidden = true;
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  window.removeEventListener('resize', positionPopover);
  window.removeEventListener('scroll', closePopoverOnScroll, true);
}

function closePopoverOnScroll() {
  const popover = $('#datePopover');
  if (popover && !popover.hidden) closePopover();
}

export function initCalendar(onChange) {
  const toggleBtn = $('#datePickerToggle');
  const popover = $('#datePopover');
  const prevMonthBtn = $('#calPrevMonth');
  const nextMonthBtn = $('#calNextMonth');

  if (!toggleBtn || !popover) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willShow = popover.hidden;
    if (willShow) {
      if (state.calSelectedDate && state.calSelectedDate !== 'overdue') {
        calCurrentView = new Date(state.calSelectedDate + 'T00:00');
      } else {
        calCurrentView = new Date();
      }
      renderVisualCalendarGrid(onChange);
      popover.hidden = false;
      positionPopover();
      toggleBtn.setAttribute('aria-expanded', 'true');
      window.addEventListener('resize', positionPopover);
      window.addEventListener('scroll', closePopoverOnScroll, true);
    } else {
      closePopover();
    }
  });

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      calCurrentView.setMonth(calCurrentView.getMonth() - 1);
      renderVisualCalendarGrid(onChange);
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      calCurrentView.setMonth(calCurrentView.getMonth() + 1);
      renderVisualCalendarGrid(onChange);
    });
  }

  // Presets
  $$('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const preset = btn.dataset.preset;
      if (preset === 'today') {
        state.calSelectedDate = todayISO();
      } else if (preset === 'tomorrow') {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        state.calSelectedDate = tom.toISOString().slice(0, 10);
      } else if (preset === 'overdue') {
        state.calSelectedDate = 'overdue';
      }
      closePopover();
      updateTriggerLabel();
      onChange && onChange();
    });
  });

  const clearBtn = $('#dpClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.calSelectedDate = null;
      closePopover();
      updateTriggerLabel();
      onChange && onChange();
    });
  }

  document.addEventListener('click', (e) => {
    if (popover && !popover.hidden && !popover.contains(e.target) && !toggleBtn.contains(e.target)) {
      closePopover();
    }
  });

  updateTriggerLabel();
}
