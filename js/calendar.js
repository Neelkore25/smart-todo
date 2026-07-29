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
    if (labelEl) labelEl.textContent = 'Calendar';
    toggleBtn.classList.remove('active');
    if (badgeEl) badgeEl.hidden = true;
  } else if (state.calSelectedDate === 'overdue') {
    if (labelEl) labelEl.textContent = 'Overdue';
    toggleBtn.classList.add('active');
    if (badgeEl) badgeEl.hidden = false;
  } else if (state.calSelectedDate === todayISO()) {
    if (labelEl) labelEl.textContent = 'Today';
    toggleBtn.classList.add('active');
    if (badgeEl) badgeEl.hidden = false;
  } else {
    const d = new Date(state.calSelectedDate + 'T00:00');
    if (labelEl) labelEl.textContent = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    toggleBtn.classList.add('active');
    if (badgeEl) badgeEl.hidden = false;
  }
}

export function initCalendar(onChange){
  const toggleBtn = $('#datePickerToggle');
  const popover = $('#datePopover');
  const dpYear = $('#dpYear'), dpMonth = $('#dpMonth'), dpDay = $('#dpDay');

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
    if (top + ph > vh - 8) top = btnRect.top - ph - gap;

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

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
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
      closePopover();
      updateDateTriggerLabel();
      onChange && onChange();
    });
  });

  $('#dpOk').addEventListener('click', () => {
    const y = Number(dpYear.value), m = Number(dpMonth.value), d = Number(dpDay.value);
    state.calSelectedDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    closePopover();
    updateDateTriggerLabel();
    onChange && onChange();
  });

  $('#dpClear').addEventListener('click', () => {
    state.calSelectedDate = null;
    closePopover();
    updateDateTriggerLabel();
    onChange && onChange();
  });

  document.addEventListener('click', (e) => {
    if (!popover.hidden && !popover.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)){
      closePopover();
    }
  });

  updateDateTriggerLabel();
}
