/**
 * PennyWise Pro - Login First Screen Component
 * Mobile-friendly, high-aesthetic Fintech Authentication Portal
 * Offers 1-tap fast demo/local accounts, Google Sign-in, and Email authentication.
 */

import { authService } from '../services/auth.js';
import { showToast } from './toast.js';

export function renderLoginView(container, onLoginSuccess) {
  if (!container) return;

  const localAccounts = authService.getLocalAccounts();

  container.innerHTML = `
    <div class="login-backdrop">
      <div class="login-card">
        <!-- Brand Header -->
        <div class="login-header">
          <div class="login-brand-icon">
            <i class="fa-solid fa-wallet"></i>
          </div>
          <h1 class="login-title">PennyWise Pro</h1>
          <p class="login-subtitle">Personal Budget & Bank Envelope Manager</p>
          <div class="login-tag">
            <i class="fa-solid fa-lock text-xs mr-1"></i> Account-Based Data Storage
          </div>
        </div>

        <!-- Mode Navigation Tabs -->
        <div class="login-tabs">
          <button id="tab-btn-profiles" class="login-tab-btn active">
            <i class="fa-solid fa-users"></i>
            <span>Profiles</span>
          </button>
          <button id="tab-btn-email" class="login-tab-btn">
            <i class="fa-solid fa-envelope"></i>
            <span>Email</span>
          </button>
          <button id="tab-btn-google" class="login-tab-btn">
            <i class="fa-brands fa-google"></i>
            <span>Google</span>
          </button>
        </div>

        <!-- Tab 1: Fast Profile Selection (Best for offline/mobile) -->
        <div id="pane-profiles" class="login-pane active">
          <p class="text-xs text-muted mb-3">
            Select an account to load your personal budget or create a new profile:
          </p>

          <div class="profile-cards-list">
            ${localAccounts.map(account => `
              <div class="profile-card" data-uid="${account.uid}">
                <div class="profile-avatar" style="background: ${account.avatarBg || '#004b23'};">
                  <i class="fa-solid ${account.avatar || 'fa-user'}"></i>
                </div>
                <div class="profile-info">
                  <h3 class="profile-name">${account.displayName}</h3>
                  <p class="profile-role">${account.role || account.email}</p>
                </div>
                <button class="btn btn-primary btn-icon-sm" title="Log into ${account.displayName}">
                  <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <!-- Create New Profile Collapsible / Form -->
          <div class="create-profile-box mt-3">
            <button id="btn-toggle-new-profile" class="btn btn-subtle text-xs w-full">
              <i class="fa-solid fa-plus-circle text-primary"></i>
              <span>Create New Local Account</span>
            </button>

            <form id="form-new-profile" class="new-profile-form" style="display: none;">
              <div class="form-group mb-2">
                <label class="form-label text-xs">Profile / Account Name</label>
                <input 
                  type="text" 
                  id="input-profile-name" 
                  class="form-input text-sm" 
                  placeholder="e.g. Isaac, Savings Account, Partner" 
                  required 
                />
              </div>

              <div class="form-group mb-2">
                <label class="form-label text-xs">Email or Account Tag</label>
                <input 
                  type="text" 
                  id="input-profile-email" 
                  class="form-input text-sm" 
                  placeholder="e.g. isaac@pennywise.app" 
                />
              </div>

              <div class="flex items-center gap-2 mt-3">
                <button type="button" id="btn-cancel-new-profile" class="btn btn-secondary text-xs flex-1">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary text-xs flex-1">
                  <i class="fa-solid fa-check"></i> Create & Sign In
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Tab 2: Email & Password (Cloud / Local Sync) -->
        <div id="pane-email" class="login-pane">
          <div class="auth-toggle-row mb-3">
            <button type="button" id="auth-submode-signin" class="btn text-xs font-bold flex-1 active-submode">Sign In</button>
            <button type="button" id="auth-submode-signup" class="btn text-xs font-bold flex-1 text-muted">Register</button>
          </div>

          <form id="form-email-auth">
            <div id="group-signup-name" class="form-group mb-2" style="display: none;">
              <label class="form-label text-xs">Your Full Name</label>
              <input type="text" id="input-auth-name" class="form-input text-sm" placeholder="e.g. Isaac Jana" />
            </div>

            <div class="form-group mb-2">
              <label class="form-label text-xs">Email Address</label>
              <input type="email" id="input-auth-email" class="form-input text-sm" placeholder="name@domain.com" required />
            </div>

            <div class="form-group mb-3">
              <label class="form-label text-xs">Password</label>
              <input type="password" id="input-auth-password" class="form-input text-sm" placeholder="••••••••" required />
            </div>

            <button type="submit" id="btn-submit-email-auth" class="btn btn-primary w-full text-sm font-bold py-2.5">
              <i class="fa-solid fa-arrow-right-to-bracket mr-1"></i> Sign In
            </button>
          </form>
        </div>

        <!-- Tab 3: Google Sign-in -->
        <div id="pane-google" class="login-pane">
          <p class="text-xs text-muted mb-4 text-center">
            Sign in with your Google account to synchronize your budget across all your mobile devices.
          </p>

          <button id="btn-google-signin" class="btn-google-social w-full">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20">
            <span>Continue with Google</span>
          </button>

          <p class="text-[11px] text-muted text-center mt-3 leading-tight">
            Fast, secure authentication powered by Google Firebase.
          </p>
        </div>

        <!-- Footer Notice -->
        <div class="login-footer">
          <i class="fa-solid fa-shield-halved text-xs text-primary"></i>
          <span>Each account maintains separate, private budget records.</span>
        </div>
      </div>
    </div>
  `;

  // Bind Events
  const tabProfiles = document.getElementById('tab-btn-profiles');
  const tabEmail = document.getElementById('tab-btn-email');
  const tabGoogle = document.getElementById('tab-btn-google');
  const paneProfiles = document.getElementById('pane-profiles');
  const paneEmail = document.getElementById('pane-email');
  const paneGoogle = document.getElementById('pane-google');

  function switchTab(activeBtn, activePane) {
    [tabProfiles, tabEmail, tabGoogle].forEach(b => b.classList.remove('active'));
    [paneProfiles, paneEmail, paneGoogle].forEach(p => p.classList.remove('active'));
    activeBtn.classList.add('active');
    activePane.classList.add('active');
  }

  tabProfiles?.addEventListener('click', () => switchTab(tabProfiles, paneProfiles));
  tabEmail?.addEventListener('click', () => switchTab(tabEmail, paneEmail));
  tabGoogle?.addEventListener('click', () => switchTab(tabGoogle, paneGoogle));

  // 1-Tap Profile login
  container.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('click', () => {
      const uid = card.dataset.uid;
      try {
        const user = authService.signInWithLocalAccount(uid);
        showToast(`Welcome back, ${user.displayName}!`, 'success');
        onLoginSuccess?.(user);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Toggle New Profile Form
  const btnToggleNew = document.getElementById('btn-toggle-new-profile');
  const formNewProfile = document.getElementById('form-new-profile');
  const btnCancelNew = document.getElementById('btn-cancel-new-profile');

  btnToggleNew?.addEventListener('click', () => {
    btnToggleNew.style.display = 'none';
    formNewProfile.style.display = 'block';
    document.getElementById('input-profile-name')?.focus();
  });

  btnCancelNew?.addEventListener('click', () => {
    formNewProfile.style.display = 'none';
    btnToggleNew.style.display = 'flex';
  });

  formNewProfile?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('input-profile-name')?.value;
    const email = document.getElementById('input-profile-email')?.value;

    try {
      const newAcc = authService.createLocalAccount({ name, email });
      authService.signInWithLocalAccount(newAcc.uid);
      showToast(`Account "${newAcc.displayName}" created!`, 'success');
      onLoginSuccess?.(newAcc);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Email Submode Toggle (Sign In vs Register)
  let isRegisterMode = false;
  const subSignIn = document.getElementById('auth-submode-signin');
  const subSignUp = document.getElementById('auth-submode-signup');
  const groupName = document.getElementById('group-signup-name');
  const btnSubmit = document.getElementById('btn-submit-email-auth');

  subSignIn?.addEventListener('click', () => {
    isRegisterMode = false;
    subSignIn.classList.add('active-submode');
    subSignIn.classList.remove('text-muted');
    subSignUp.classList.remove('active-submode');
    subSignUp.classList.add('text-muted');
    groupName.style.display = 'none';
    btnSubmit.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket mr-1"></i> Sign In';
  });

  subSignUp?.addEventListener('click', () => {
    isRegisterMode = true;
    subSignUp.classList.add('active-submode');
    subSignUp.classList.remove('text-muted');
    subSignIn.classList.remove('active-submode');
    subSignIn.classList.add('text-muted');
    groupName.style.display = 'block';
    btnSubmit.innerHTML = '<i class="fa-solid fa-user-plus mr-1"></i> Create Account';
  });

  // Email Form Submit
  const formEmail = document.getElementById('form-email-auth');
  formEmail?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('input-auth-email')?.value.trim();
    const password = document.getElementById('input-auth-password')?.value;
    const displayName = document.getElementById('input-auth-name')?.value.trim();

    btnSubmit.disabled = true;
    btnSubmit.style.opacity = '0.7';

    try {
      let user;
      if (isRegisterMode) {
        user = await authService.signUpWithEmail(email, password, displayName);
        showToast(`Account registered for ${user.displayName}!`, 'success');
      } else {
        user = await authService.signInWithEmail(email, password);
        showToast(`Welcome back, ${user.displayName}!`, 'success');
      }
      onLoginSuccess?.(user);
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.style.opacity = '1';
    }
  });

  // Google Sign-In
  const btnGoogle = document.getElementById('btn-google-signin');
  btnGoogle?.addEventListener('click', async () => {
    try {
      btnGoogle.disabled = true;
      const user = await authService.signInWithGoogle();
      showToast(`Signed in as ${user.displayName}!`, 'success');
      onLoginSuccess?.(user);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnGoogle.disabled = false;
    }
  });
}
