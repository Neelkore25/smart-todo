/* ============================================================
   LOGIN PAGE CONTROLLER
   Runs only on login.html. Reuses the exact same PBKDF2 + AES-GCM
   verifier logic as the in-app vault (js/auth.js) so a vault
   created here is 100% compatible with the one used inside the
   app, and vice versa.

   On success (or on "Continue as guest") it stores a short-lived
   flag in sessionStorage and redirects to index.html. index.html's
   gate script (see the inline script in its <head>) checks that
   flag before allowing the app to render.
   ============================================================ */
import { $ } from './dom.js';
import { paintIcons } from './icons.js';
import { safeStorage } from './storage.js';
import { toast } from './toast.js';
import { encryptData, decryptData, isVaultConfigured } from './auth.js';

const VERIFIER_KEY = 'smarttodo.e2e.verifier';
const ENCRYPTED_TASKS_KEY = 'smarttodo.e2e.tasks';
const USER_INFO_KEY = 'smarttodo.e2e.user';

// Session-only handoff — never written to localStorage, cleared the
// moment index.html reads it, and gone entirely once the tab closes.
const GATE_KEY = 'smarttodo.session.entered';
const PENDING_UNLOCK_KEY = 'smarttodo.session.pendingUnlock';

function goToApp() {
  window.location.replace('index.html');
}

function initLoginForm() {
  const form = $('#loginForm');
  const title = $('#loginTitle');
  const subtitle = $('#loginSubtitle');
  const usernameGroup = $('#loginUsernameGroup');
  const submitBtn = $('#loginSubmitBtn');
  const toggleBtn = $('#toggleLoginMode');
  const guestBtn = $('#continueGuestBtn');

  let mode = isVaultConfigured() ? 'login' : 'register';

  function render() {
    if (mode === 'register') {
      title.textContent = 'Create Your Vault';
      subtitle.textContent = 'Protect your tasks with AES-256-GCM zero-knowledge encryption.';
      usernameGroup.hidden = false;
      submitBtn.textContent = 'Create Vault & Continue';
      toggleBtn.hidden = !isVaultConfigured();
      toggleBtn.textContent = 'Already have a vault? Log in';
    } else {
      title.textContent = 'Unlock Your Vault';
      subtitle.textContent = 'Enter your master password to decrypt your tasks.';
      usernameGroup.hidden = true;
      submitBtn.textContent = 'Unlock Vault';
      toggleBtn.hidden = false;
      toggleBtn.textContent = 'Create New Vault / Reset';
    }
  }

  toggleBtn.addEventListener('click', () => {
    mode = mode === 'register' ? 'login' : 'register';
    render();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = $('#loginPassword').value.trim();
    if (!pass || pass.length < 4) {
      toast('Password must be at least 4 characters long', { icon: 'alert-triangle' });
      return;
    }

    submitBtn.disabled = true;

    if (mode === 'register') {
      try {
        const user = $('#loginUsername').value.trim() || 'User';
        const verifierPayload = await encryptData({ verifier: 'SMART_TODO_VAULT_VALID' }, pass);
        safeStorage.set(VERIFIER_KEY, verifierPayload);
        safeStorage.set(USER_INFO_KEY, user);

        // No tasks exist yet at this point (they live only inside the
        // app's state) so we just hand the password to index.html and
        // let its normal auth flow encrypt/store the current task list.
        try {
          sessionStorage.setItem(GATE_KEY, '1');
          sessionStorage.setItem(PENDING_UNLOCK_KEY, pass);
        } catch (err) { /* sessionStorage unavailable — app will just start locked */ }

        toast('Vault created! Redirecting…', { icon: 'shield-check' });
        setTimeout(goToApp, 400);
      } catch (err) {
        submitBtn.disabled = false;
        toast('Failed to create encrypted vault.', { icon: 'alert-triangle' });
      }
    } else {
      try {
        const verifierPayload = safeStorage.get(VERIFIER_KEY, null);
        if (!verifierPayload) throw new Error('No vault configured');
        const check = await decryptData(verifierPayload, pass);
        if (check.verifier !== 'SMART_TODO_VAULT_VALID') throw new Error('Invalid key');

        try {
          sessionStorage.setItem(GATE_KEY, '1');
          sessionStorage.setItem(PENDING_UNLOCK_KEY, pass);
        } catch (err) { /* sessionStorage unavailable — app will just start locked */ }

        toast('Vault unlocked! Redirecting…', { icon: 'shield-check' });
        setTimeout(goToApp, 400);
      } catch (err) {
        submitBtn.disabled = false;
        toast('Incorrect master password. Try again.', { icon: 'alert-triangle' });
      }
    }
  });

  guestBtn.addEventListener('click', () => {
    try { sessionStorage.setItem(GATE_KEY, '1'); } catch (err) { /* ignore */ }
    goToApp();
  });

  render();
}

initLoginForm();
paintIcons();
