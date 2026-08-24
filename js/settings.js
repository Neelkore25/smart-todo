/* ============================================================
   SETTINGS MODULE — Functional Settings Modal & Preferences
   Manages user preferences (theme, default priority, category,
   sound, data export/import, data reset) persisted in localStorage.
   ============================================================ */
import { $, $$ } from './dom.js';
import { safeStorage } from './storage.js';
import { toast } from './toast.js';
import { state, persistTasks } from './state.js';
import { setTheme, getTheme } from './theme.js';

const SETTINGS_KEY = 'smarttodo.settings';

const defaultSettings = {
  defaultPriority: 'med',
  defaultCategory: 'Other',
  soundEnabled: true,
  compactView: false
};

let userSettings = { ...defaultSettings };

export function loadSettings() {
  const saved = safeStorage.get(SETTINGS_KEY, null);
  if (saved) {
    userSettings = { ...defaultSettings, ...saved };
  }
  return userSettings;
}

export function getSetting(key) {
  return userSettings[key];
}

export function saveSettings(newSettings) {
  userSettings = { ...userSettings, ...newSettings };
  safeStorage.set(SETTINGS_KEY, userSettings);
  applySettingsUI();
}

function applySettingsUI() {
  const body = document.body;
  if (userSettings.compactView) {
    body.classList.add('compact-mode');
  } else {
    body.classList.remove('compact-mode');
  }
}

export function initSettings(onTasksUpdated) {
  loadSettings();
  applySettingsUI();

  const settingsModal = $('#settingsModal');
  const settingsBtn = $('#settingsToggleBtn');
  const closeBtn = $('#closeSettingsBtn');
  const settingsForm = $('#settingsForm');
  const resetDataBtn = $('#resetDataBtn');

  if (!settingsModal || !settingsBtn) return;

  function openSettings() {
    // Populate form values
    const themeSelect = $('#settingThemeSelect');
    const prioritySelect = $('#settingPrioritySelect');
    const categorySelect = $('#settingCategorySelect');
    const soundToggle = $('#settingSoundToggle');
    const compactToggle = $('#settingCompactToggle');

    if (themeSelect) themeSelect.value = getTheme();
    if (prioritySelect) prioritySelect.value = userSettings.defaultPriority;
    if (categorySelect) categorySelect.value = userSettings.defaultCategory;
    if (soundToggle) soundToggle.checked = userSettings.soundEnabled;
    if (compactToggle) compactToggle.checked = userSettings.compactView;

    settingsModal.hidden = false;
  }

  function closeSettings() {
    settingsModal.hidden = true;
  }

  settingsBtn.addEventListener('click', openSettings);
  if (closeBtn) closeBtn.addEventListener('click', closeSettings);

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  if (settingsForm) {
    settingsForm.addEventListener('change', (e) => {
      const themeSelect = $('#settingThemeSelect');
      const prioritySelect = $('#settingPrioritySelect');
      const categorySelect = $('#settingCategorySelect');
      const soundToggle = $('#settingSoundToggle');
      const compactToggle = $('#settingCompactToggle');

      if (themeSelect && e.target === themeSelect) {
        setTheme(themeSelect.value);
      }

      saveSettings({
        defaultPriority: prioritySelect ? prioritySelect.value : 'med',
        defaultCategory: categorySelect ? categorySelect.value : 'Other',
        soundEnabled: soundToggle ? soundToggle.checked : true,
        compactView: compactToggle ? compactToggle.checked : false
      });

      // Update task form defaults
      const taskPriority = $('#prioritySelect');
      const taskCategory = $('#categorySelect');
      if (taskPriority && e.target === prioritySelect) taskPriority.value = prioritySelect.value;
      if (taskCategory && e.target === categorySelect) taskCategory.value = categorySelect.value;
    });
  }

  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all tasks and settings? This cannot be undone.')) {
        state.tasks = [];
        persistTasks();
        safeStorage.set(SETTINGS_KEY, defaultSettings);
        userSettings = { ...defaultSettings };
        applySettingsUI();
        onTasksUpdated && onTasksUpdated();
        closeSettings();
        toast('All app data reset to default', { icon: 'trash-2' });
      }
    });
  }
}
