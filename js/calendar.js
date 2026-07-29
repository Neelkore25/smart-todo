/* ============================================================
   DATE FILTER — year / month / day popover with presets.
   Sets state.calSelectedDate (an ISO date or 'overdue') used
   by tasks.js to filter the list.
   ============================================================ */
import { $, $$ } from './dom.js';
import { state, todayISO } from './state.js';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function daysInMonth(y, m){ return new Date(y, m + 1, 0).getDate(); }

function populateSelects(){
  const now = new Date();
  const dpYear = $('#dpYear'), dpMonth = $('#dpMonth'), dpDay = $('#dpDay');
  const base = (state.calSelectedDate && state.calSelectedDate !== 'overdue') 
    ? new Date(state.calSelectedDate + 'T00:00') 
    : now;

  dpYear.innerHTML = Array.from({ length: 12 }, (_, i) => now.getFullYear() - 5 + i)
    .map(y => `<option value="${y}" ${y === base.getFullYear() ? 'selected' : ''}>${y}</option>`).join('');
  dpMonth.innerHTML = MONTHS.map((name, i) => `<option value="${i}" ${i === base.getMonth() ? 'selected' : ''}>${name}</option>`).join('');
  fillDays(base.getFullYear(), base.getMonth(), base.getDate());
}

function fillDays(y, m, selectedDay){
  const dpDay = $('#dpDay');
  const total = daysInMonth(y, m);
  const day = Math.min(selectedDay || 1, total);
  dpDay.innerHTML = Array.from({ length: total }, (_, i) => i + 1)
    .map(d => `<option value="${d}" ${d === day ? 'selected' : ''}>${d}</option>`).join('');
}

function updateDateTriggerLabel() {
  const toggleBtn = $('#datePickerToggle');
  const labelEl = $('#dateFilterLabel');
  const badgeEl = $('#dateFilterActiveBadge');

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

export function initCalendar(onChange){
  const toggleBtn = $('#datePickerToggle');
  const popover = $('#datePopover');
  const dpYear = $('#dpYear'), dpMonth = $('#dpMonth'), dpDay = $('#dpDay');

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willShow = popover.hidden;
    if (willShow) populateSelects();
    popover.hidden = !willShow;
    toggleBtn.setAttribute('aria-expanded', String(willShow));
  });

  [dpYear, dpMonth].forEach(sel => sel.addEventListener('change', () => {
    fillDays(Number(dpYear.value), Number(dpMonth.value), Number(dpDay.value));
  }));

  // Presets
  $$('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
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
      popover.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
      updateDateTriggerLabel();
      onChange && onChange();
    });
  });

  $('#dpOk').addEventListener('click', () => {
    const y = Number(dpYear.value), m = Number(dpMonth.value), d = Number(dpDay.value);
    state.calSelectedDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    popover.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    updateDateTriggerLabel();
    onChange && onChange();
  });

  $('#dpClear').addEventListener('click', () => {
    state.calSelectedDate = null;
    popover.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    updateDateTriggerLabel();
    onChange && onChange();
  });

  document.addEventListener('click', (e) => {
    if (!popover.hidden && !popover.contains(e.target) && !toggleBtn.contains(e.target)){
      popover.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  updateDateTriggerLabel();
}

