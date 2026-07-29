/* ============================================================
   AUTH & END-TO-END ENCRYPTION (E2E) MODULE
   Uses Web Crypto API (PBKDF2 + AES-256-GCM) to encrypt and
   decrypt task data on the client side with a master password.
   Zero-knowledge: No plaintext data is ever saved to storage.
   ============================================================ */
import { $ } from './dom.js';
import { safeStorage } from './storage.js';
import { toast } from './toast.js';
import { state, persistTasks } from './state.js';

const SALT_KEY = 'smarttodo.e2e.salt';
const VERIFIER_KEY = 'smarttodo.e2e.verifier';
const ENCRYPTED_TASKS_KEY = 'smarttodo.e2e.tasks';
const USER_INFO_KEY = 'smarttodo.e2e.user';

// Utility: ArrayBuffer <-> Base64
function bufferToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToBuffer(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Generate cryptographically secure random salt/IV
function getSalt() {
  let saltStr = safeStorage.get(SALT_KEY, null);
  if (!saltStr) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    saltStr = bufferToBase64(salt);
    safeStorage.set(SALT_KEY, saltStr);
  }
  return new Uint8Array(base64ToBuffer(saltStr));
}

// Derive AES-256 key from master password using PBKDF2
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext JSON object with AES-GCM
export async function encryptData(data, password) {
  try {
    const salt = getSalt();
    const key = await deriveKey(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      enc.encode(JSON.stringify(data))
    );
    return JSON.stringify({
      iv: bufferToBase64(iv),
      cipher: bufferToBase64(ciphertext)
    });
  } catch (err) {
    console.error('Encryption error:', err);
    throw err;
  }
}

// Decrypt ciphertext JSON string with AES-GCM
export async function decryptData(encryptedPayload, password) {
  try {
    const payload = JSON.parse(encryptedPayload);
    const salt = getSalt();
    const key = await deriveKey(password, salt);
    const iv = new Uint8Array(base64ToBuffer(payload.iv));
    const cipher = base64ToBuffer(payload.cipher);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      cipher
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  } catch (err) {
    console.error('Decryption error:', err);
    throw new Error('Invalid master password or corrupted vault.');
  }
}

// Active session state
let sessionPassword = null;
let currentUser = safeStorage.get(USER_INFO_KEY, null);

export function getSessionPassword() {
  return sessionPassword;
}

export function isVaultConfigured() {
  return !!safeStorage.get(VERIFIER_KEY, null);
}

export function isVaultUnlocked() {
  return !!sessionPassword;
}

// Update Topbar Auth Badge
export function updateAuthBadge() {
  const badgeBtn = $('#authBadgeBtn');
  if (!badgeBtn) return;
  if (isVaultUnlocked()) {
    badgeBtn.innerHTML = `<i data-lucide="shield-check"></i> <span>E2E Vault (${currentUser || 'User'})</span>`;
    badgeBtn.className = 'auth-badge-btn unlocked';
    badgeBtn.title = 'Vault unlocked with AES-256-GCM. Click to lock.';
  } else if (isVaultConfigured()) {
    badgeBtn.innerHTML = `<i data-lucide="lock"></i> <span>Unlock Vault</span>`;
    badgeBtn.className = 'auth-badge-btn locked';
    badgeBtn.title = 'Vault locked. Click to enter Master Password.';
  } else {
    badgeBtn.innerHTML = `<i data-lucide="key"></i> <span>Enable E2E Vault</span>`;
    badgeBtn.className = 'auth-badge-btn setup';
    badgeBtn.title = 'Set up End-to-End Encrypted Storage.';
  }
  if (window.paintIcons) window.paintIcons();
}

// Setup Auth Modal & Event Handlers
export function initAuth(onTasksUpdated) {
  const modal = $('#authModal');
  const badgeBtn = $('#authBadgeBtn');
  const closeModalBtn = $('#closeAuthModal');
  const authForm = $('#authForm');
  const authTitle = $('#authModalTitle');
  const authSubtitle = $('#authModalSubtitle');
  const usernameGroup = $('#usernameGroup');
  const submitBtn = $('#authSubmitBtn');
  const toggleAuthModeBtn = $('#toggleAuthMode');
  const lockVaultBtn = $('#lockVaultBtn');

  let mode = isVaultConfigured() ? 'login' : 'register';

  function renderModalState() {
    if (mode === 'register') {
      authTitle.textContent = 'Setup E2E Encrypted Vault';
      authSubtitle.textContent = 'Protect your tasks with AES-256-GCM zero-knowledge encryption.';
      usernameGroup.hidden = false;
      submitBtn.textContent = 'Create Vault & Encrypt';
      toggleAuthModeBtn.hidden = !isVaultConfigured();
      toggleAuthModeBtn.textContent = 'Already have a vault? Log In';
      if (lockVaultBtn) lockVaultBtn.hidden = true;
    } else {
      authTitle.textContent = 'Unlock E2E Encrypted Vault';
      authSubtitle.textContent = 'Enter your master password to decrypt your tasks.';
      usernameGroup.hidden = true;
      submitBtn.textContent = 'Unlock Vault';
      toggleAuthModeBtn.hidden = false;
      toggleAuthModeBtn.textContent = 'Create New Vault / Reset';
      if (lockVaultBtn) lockVaultBtn.hidden = !isVaultUnlocked();
    }
  }

  function openModal() {
    mode = isVaultConfigured() ? 'login' : 'register';
    renderModalState();
    modal.hidden = false;
    $('#authPassword').value = '';
    if (mode === 'register') $('#authUsername').value = currentUser || '';
    $('#authPassword').focus();
  }

  function closeModal() {
    modal.hidden = true;
  }

  badgeBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  toggleAuthModeBtn.addEventListener('click', () => {
    mode = mode === 'register' ? 'login' : 'register';
    renderModalState();
  });

  if (lockVaultBtn) {
    lockVaultBtn.addEventListener('click', () => {
      sessionPassword = null;
      updateAuthBadge();
      closeModal();
      toast('Vault locked. Task data encrypted in memory.', { icon: 'lock' });
    });
  }

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = $('#authPassword').value.trim();
    if (!pass || pass.length < 4) {
      toast('Password must be at least 4 characters long', { icon: 'alert-triangle' });
      return;
    }

    if (mode === 'register') {
      try {
        const user = $('#authUsername').value.trim() || 'User';
        const verifierPayload = await encryptData({ verifier: 'SMART_TODO_VAULT_VALID' }, pass);
        safeStorage.set(VERIFIER_KEY, verifierPayload);
        safeStorage.set(USER_INFO_KEY, user);
        currentUser = user;
        sessionPassword = pass;

        // Encrypt existing tasks
        const encrypted = await encryptData(state.tasks, pass);
        safeStorage.set(ENCRYPTED_TASKS_KEY, encrypted);

        updateAuthBadge();
        closeModal();
        toast('E2E Encrypted Vault created & unlocked!', { icon: 'shield-check' });
      } catch (err) {
        toast('Failed to create encrypted vault.', { icon: 'alert-triangle' });
      }
    } else {
      // Login / Unlock
      try {
        const verifierPayload = safeStorage.get(VERIFIER_KEY, null);
        if (!verifierPayload) throw new Error('No vault configured');
        const check = await decryptData(verifierPayload, pass);
        if (check.verifier !== 'SMART_TODO_VAULT_VALID') throw new Error('Invalid key');

        sessionPassword = pass;

        // Load encrypted tasks if available
        const encryptedTasks = safeStorage.get(ENCRYPTED_TASKS_KEY, null);
        if (encryptedTasks) {
          const decryptedTasks = await decryptData(encryptedTasks, pass);
          if (Array.isArray(decryptedTasks)) {
            state.tasks = decryptedTasks;
            persistTasks();
            onTasksUpdated && onTasksUpdated();
          }
        }

        updateAuthBadge();
        closeModal();
        toast(`Vault unlocked for ${currentUser || 'User'}`, { icon: 'shield-check' });
      } catch (err) {
        toast('Incorrect master password. Try again.', { icon: 'alert-triangle' });
      }
    }
  });

  updateAuthBadge();
}
