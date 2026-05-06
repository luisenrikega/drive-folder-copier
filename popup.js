document.addEventListener('DOMContentLoaded', async () => {
  // Apply translations to all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = currentLang;

  const folderInput = document.getElementById('folder-id');
  const copyBtn = document.getElementById('copy-btn');
  const loginBtn = document.getElementById('login-btn');
  const authStatus = document.getElementById('auth-status');
  const statusDot = document.querySelector('.status-dot');
  const statusContainer = document.getElementById('status-container');
  const statusMsg = document.getElementById('status-msg');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const loader = copyBtn.querySelector('.loader');
  const btnText = copyBtn.querySelector('span');
  const resetBtn = document.getElementById('reset-btn');

  let isLoggedIn = false;

  // 1. Initial status check
  chrome.runtime.sendMessage({ action: 'getStatus' }, (state) => {
    if (state && state.isCopying) {
      updateUIState(state);
    }
  });

  // 2. Auth check helper
  async function checkAuth() {
    try {
      const token = await driveService.getAuthToken(false);
      if (token) {
        isLoggedIn = true;
        authStatus.textContent = t('connected');
        statusDot.classList.add('active');
        loginBtn.textContent = t('disconnect');
      } else {
        setLoggedOut();
      }
    } catch (e) {
      setLoggedOut();
    }
  }

  function setLoggedOut() {
    isLoggedIn = false;
    authStatus.textContent = t('notConnected');
    statusDot.classList.remove('active');
    loginBtn.textContent = t('connect');
  }

  await checkAuth();

  // 3. Listen for updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'progressUpdate') {
      updateUIState(message);
    }
  });

  loginBtn.addEventListener('click', async () => {
    try {
      if (isLoggedIn) {
        const token = await driveService.getAuthToken(false);
        if (token) {
          // 1. Revoke the token server-side so it's truly invalidated
          try {
            await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
          } catch (_) { /* ignore network errors during revoke */ }
          // 2. Remove from Chrome's cache
          chrome.identity.removeCachedAuthToken({ token }, () => {
            // 3. Clear the internal token reference
            driveService.token = null;
            setLoggedOut();
          });
        } else {
          setLoggedOut();
        }
      } else {
        await driveService.getAuthToken(true);
        checkAuth();
      }
    } catch (e) {
      alert(t('authError', { message: e.message }));
    }
  });

  copyBtn.addEventListener('click', () => {
    const input = folderInput.value.trim();
    if (!input) {
      alert(t('enterUrl'));
      return;
    }

    const folderId = extractFolderId(input);
    if (!folderId) {
      alert(t('invalidId'));
      return;
    }

    chrome.runtime.sendMessage({ action: 'startCopy', folderId }, (response) => {
      if (response && response.status === 'started') {
        setLoading(true);
        statusContainer.classList.remove('hidden');
        statusMsg.style.color = 'var(--text-dim)';
        progressFill.style.backgroundColor = '';
      } else if (response && response.status === 'already_running') {
        alert(t('alreadyRunning'));
      }
    });
  });

  resetBtn.addEventListener('click', () => {
    folderInput.value = '';
    statusContainer.classList.add('hidden');
    copyBtn.classList.remove('hidden');
    resetBtn.classList.add('hidden');
    chrome.runtime.sendMessage({ action: 'resetStatus' });
  });

  function updateUIState(state) {
    if (state.isCopying) {
      setLoading(true);
      statusContainer.classList.remove('hidden');
      copyBtn.classList.remove('hidden');
      resetBtn.classList.add('hidden');
      statusMsg.textContent = state.message;
      progressFill.style.width = `${state.progress}%`;
      progressText.textContent = `${Math.round(state.progress)}%`;
      
      if (state.progress === 0 && !state.message.includes('Error')) {
        progressFill.classList.add('pulse');
      } else {
        progressFill.classList.remove('pulse');
      }
    } else {
      setLoading(false);
      if (state.progress === 100) {
        statusMsg.textContent = t('completedSuccess');
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
        statusMsg.style.color = '#4ade80';
        copyBtn.classList.add('hidden');
        resetBtn.classList.remove('hidden');
      } else if (state.message && state.message.includes('Error')) {
        statusContainer.classList.remove('hidden');
        statusMsg.textContent = state.message;
        statusMsg.style.color = '#ef4444';
        progressFill.style.backgroundColor = '#ef4444';
        copyBtn.classList.remove('hidden');
        resetBtn.classList.add('hidden');
      } else {
        statusContainer.classList.add('hidden');
        copyBtn.classList.remove('hidden');
        resetBtn.classList.add('hidden');
      }
    }
  }

  function extractFolderId(str) {
    const match = str.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  }

  function setLoading(loading) {
    copyBtn.disabled = loading;
    if (loading) {
      loader.classList.remove('hidden');
      btnText.textContent = t('copying');
    } else {
      loader.classList.add('hidden');
      btnText.textContent = t('startCopy');
    }
  }
});
