/* Settings & Preferences Module */
import { $, $$ } from './dom.js';
import { safeStorage } from './storage.js';
import { setTheme, getTheme } from './theme.js';
import { toast } from './toast.js';
import { state, persistTasks } from './state.js';

const SETTINGS_KEY = 'smarttodo.settings';

const defaultSettings = {
  theme: 'dark',
  defaultPriority: 'med',
  defaultCategory: 'Other',
  compactMode: false,
  soundEnabled: true
};

export function loadSettings() {
  return { ...defaultSettings, ...safeStorage.get(SETTINGS_KEY, {}) };
}

export function saveSettings(settings) {
  safeStorage.set(SETTINGS_KEY, settings);
}

export function getSetting(key) {
  const current = loadSettings();
  return current[key] !== undefined ? current[key] : defaultSettings[key];
}

export function initSettings(onRenderTasks) {
  const modal = $('#settingsModal');
  const openBtn = $('#settingsToggleBtn');
  const closeBtn = $('#closeSettingsBtn');
  const themeSelect = $('#settingThemeSelect');
  const prioritySelect = $('#settingPrioritySelect');
  const categorySelect = $('#settingCategorySelect');
  const compactToggle = $('#settingCompactToggle');
  const soundToggle = $('#settingSoundToggle');
  const resetBtn = $('#resetDataBtn');

  if (!modal || !openBtn) return;

  function syncFormWithSettings() {
    const settings = loadSettings();
    if (themeSelect) themeSelect.value = getTheme();
    if (prioritySelect) prioritySelect.value = settings.defaultPriority;
    if (categorySelect) categorySelect.value = settings.defaultCategory;
    if (compactToggle) compactToggle.checked = !!settings.compactMode;
    if (soundToggle) soundToggle.checked = settings.soundEnabled !== false;

    document.body.classList.toggle('compact-mode', !!settings.compactMode);
  }

  function openModal() {
    syncFormWithSettings();
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      setTheme(mode);
      const settings = loadSettings();
      settings.theme = mode;
      saveSettings(settings);
    });
  }

  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      const settings = loadSettings();
      settings.defaultPriority = e.target.value;
      saveSettings(settings);
      const addPriority = $('#prioritySelect');
      if (addPriority) addPriority.value = e.target.value;
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      const settings = loadSettings();
      settings.defaultCategory = e.target.value;
      saveSettings(settings);
      const addCat = $('#categorySelect');
      if (addCat) addCat.value = e.target.value;
    });
  }

  if (compactToggle) {
    compactToggle.addEventListener('change', (e) => {
      const settings = loadSettings();
      settings.compactMode = e.target.checked;
      saveSettings(settings);
      document.body.classList.toggle('compact-mode', e.target.checked);
    });
  }

  if (soundToggle) {
    soundToggle.addEventListener('change', (e) => {
      const settings = loadSettings();
      settings.soundEnabled = e.target.checked;
      saveSettings(settings);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all tasks and restore default settings? This action cannot be undone.')) {
        state.tasks = [];
        persistTasks();
        onRenderTasks && onRenderTasks();
        closeModal();
        toast('All tasks and preferences reset.', { icon: 'trash-2' });
      }
    });
  }

  // Apply compact mode on load
  const settings = loadSettings();
  if (settings.compactMode) {
    document.body.classList.add('compact-mode');
  }
}
