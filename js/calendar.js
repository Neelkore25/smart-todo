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



export function initCalendar(onChange){
  const toggleBtn = $('#datePickerToggle');
  const popover = $('#datePopover');
  const dpYear = $('#dpYear'), dpMonth = $('#dpMonth'), dpDay = $('#dpDay');

  // Fixed-position + JS-computed coordinates instead of relying on
  // `position: absolute` inside the toolbar's stacking context — that
  // approach was fragile (any ancestor gaining a transform/filter/opacity
  // stacking context, now or in a future edit, could trap the popover
  // behind later sections again). Fixed positioning against the viewport
  // sidesteps that class of bug entirely.
  function positionPopover(){
    const btnRect = toggleBtn.getBoundingClientRect();
    const gap = 8;
    const vw = window.innerWidth, vh = window.innerHeight;

    popover.style.left = '0px';
    popover.style.top = '0px';
    const pw = popover.offsetWidth, ph = popover.offsetHeight;

    let left = btnRect.right - pw;
    let top = btnRect.bottom + gap;

    left = Math.min(Math.max(left, 8), vw - pw - 8);
    if (top + ph > vh - 8) top = btnRect.top - ph - gap; // flip above if no room below

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  function closeOnScroll(){ if (!popover.hidden) closePopover(); }
  function closePopover(){
    popover.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    window.removeEventListener('resize', positionPopover);
    window.removeEventListener('scroll', closeOnScroll, true);
  }

  toggleBtn.addEventListener('click', () => {
    const willShow = popover.hidden;
    if (willShow){
      populateSelects();
      popover.hidden = false;
      positionPopover();
      toggleBtn.setAttribute('aria-expanded', 'true');
      window.addEventListener('resize', positionPopover);
      window.addEventListener('scroll', closeOnScroll, true);
    } else {
      closePopover();
    }
  });

  [dpYear, dpMonth].forEach(sel => sel.addEventListener('change', () => {
    fillDays(Number(dpYear.value), Number(dpMonth.value), Number(dpDay.value));
  }));

  $('#dpOk').addEventListener('click', () => {
    const y = Number(dpYear.value), m = Number(dpMonth.value), d = Number(dpDay.value);
    state.calSelectedDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    closePopover();
    toggleBtn.classList.add('active');
    onChange && onChange();
  });

  $('#dpClear').addEventListener('click', () => {
    state.calSelectedDate = null;
    closePopover();
    toggleBtn.classList.remove('active');
    onChange && onChange();
  });

  document.addEventListener('click', (e) => {
    if (!popover.hidden && !popover.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)){
      closePopover();
    }
  });
}
