/* Visual Monthly Interactive Calendar Grid Module */
import { $, $$ } from './dom.js';
import { state, todayISO } from './state.js';
import { toast } from './toast.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function initCalendar(onDateSelected) {
  const toggleBtn = $('#datePickerToggle');
  const popover = $('#datePopover');
  const labelSpan = $('#dateFilterLabel');
  const monthYearLabel = $('#calMonthYearLabel');
  const daysGrid = $('#calGridDays');
  const prevBtn = $('#calPrevMonth');
  const nextBtn = $('#calNextMonth');
  const clearBtn = $('#dpClear');
  const presetBtns = $$('.preset-btn');

  if (!toggleBtn || !popover) return;

  // Always sync calendar view to current system month and year on boot
  const now = new Date();
  state.calViewYear = now.getFullYear();
  state.calViewMonth = now.getMonth();

  function togglePopover() {
    const isHidden = popover.hidden;
    popover.hidden = !isHidden;
    toggleBtn.setAttribute('aria-expanded', String(isHidden));
    if (isHidden) {
      // Re-sync to current date when opening if no date filter active
      if (!state.calSelectedDate) {
        const currentDate = new Date();
        state.calViewYear = currentDate.getFullYear();
        state.calViewMonth = currentDate.getMonth();
      }
      renderGrid();
    }
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopover();
  });

  document.addEventListener('click', (e) => {
    if (!popover.hidden && !popover.contains(e.target) && !toggleBtn.contains(e.target)) {
      popover.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.calViewMonth === 0) {
        state.calViewMonth = 11;
        state.calViewYear--;
      } else {
        state.calViewMonth--;
      }
      renderGrid();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.calViewMonth === 11) {
        state.calViewMonth = 0;
        state.calViewYear++;
      } else {
        state.calViewMonth++;
      }
      renderGrid();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.calSelectedDate = null;
      labelSpan.textContent = 'Calendar';
      toggleBtn.classList.remove('active');
      popover.hidden = true;
      onDateSelected && onDateSelected();
      toast('Date filter cleared', { icon: 'calendar' });
    });
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.preset;
      const today = new Date();
      if (p === 'today') {
        state.calSelectedDate = todayISO();
        labelSpan.textContent = 'Today';
      } else if (p === 'tomorrow') {
        const tom = new Date(today);
        tom.setDate(tom.getDate() + 1);
        state.calSelectedDate = tom.getFullYear() + '-' + String(tom.getMonth() + 1).padStart(2, '0') + '-' + String(tom.getDate()).padStart(2, '0');
        labelSpan.textContent = 'Tomorrow';
      } else if (p === 'overdue') {
        state.calSelectedDate = 'overdue';
        labelSpan.textContent = 'Overdue';
      }
      toggleBtn.classList.add('active');
      popover.hidden = true;
      onDateSelected && onDateSelected();
    });
  });

  function renderGrid() {
    if (!daysGrid || !monthYearLabel) return;

    const year = state.calViewYear;
    const month = state.calViewMonth;

    monthYearLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    let html = `
      <div class="cal-week-header">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>
      <div class="cal-days-grid">
    `;

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      html += `<button type="button" class="cal-day-cell other-month" disabled>${prevMonthDays - i}</button>`;
    }

    const todayStr = todayISO();

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === state.calSelectedDate;
      const hasTasks = state.tasks.some(t => t.due === dateStr);

      let classes = 'cal-day-cell';
      if (isToday) classes += ' today';
      if (isSelected) classes += ' selected';
      if (hasTasks) classes += ' has-tasks';

      html += `<button type="button" class="${classes}" data-date="${dateStr}">${d}</button>`;
    }

    html += `</div>`;
    daysGrid.innerHTML = html;

    $$('.cal-day-cell:not(.other-month)', daysGrid).forEach(cell => {
      cell.addEventListener('click', () => {
        const selDate = cell.dataset.date;
        state.calSelectedDate = selDate;
        labelSpan.textContent = new Date(selDate + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        toggleBtn.classList.add('active');
        popover.hidden = true;
        onDateSelected && onDateSelected();
      });
    });
  }

  // Initial grid render
  renderGrid();
}
