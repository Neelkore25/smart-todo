/* ============================================================
   DATE FILTER — year / month / day popover with an OK button.
   Sets state.calSelectedDate (an ISO date) used by tasks.js to
   filter the list, replacing the old month-grid calendar view.
   ============================================================ */
import { $ } from './dom.js';
import { state } from './state.js';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function daysInMonth(y, m){ return new Date(y, m + 1, 0).getDate(); }

function populateSelects(){
  const now = new Date();
  const dpYear = $('#dpYear'), dpMonth = $('#dpMonth'), dpDay = $('#dpDay');
  const base = state.calSelectedDate ? new Date(state.calSelectedDate + 'T00:00') : now;

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

export function renderCalendar(){ /* no-op: kept so tasks.js's existing import/call stays valid */ }

export function initCalendar(onChange){
  const toggleBtn = $('#datePickerToggle');
  const popover = $('#datePopover');
  const dpYear = $('#dpYear'), dpMonth = $('#dpMonth'), dpDay = $('#dpDay');

  toggleBtn.addEventListener('click', () => {
    const willShow = popover.hidden;
    if (willShow) populateSelects();
    popover.hidden = !willShow;
    toggleBtn.setAttribute('aria-expanded', String(willShow));
  });

  [dpYear, dpMonth].forEach(sel => sel.addEventListener('change', () => {
    fillDays(Number(dpYear.value), Number(dpMonth.value), Number(dpDay.value));
  }));

  $('#dpOk').addEventListener('click', () => {
    const y = Number(dpYear.value), m = Number(dpMonth.value), d = Number(dpDay.value);
    state.calSelectedDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    popover.hidden = true;
    toggleBtn.classList.add('active');
    onChange && onChange();
  });

  $('#dpClear').addEventListener('click', () => {
    state.calSelectedDate = null;
    popover.hidden = true;
    toggleBtn.classList.remove('active');
    onChange && onChange();
  });

  document.addEventListener('click', (e) => {
    if (!popover.hidden && !popover.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)){
      popover.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}
