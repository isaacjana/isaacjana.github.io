/**
 * PennyWise Pro - Google Login Screen Component
 * Modern, high-aesthetic Fintech Google Authentication Portal.
 */

import { authService } from '../services/auth.js';
import { showToast } from './toast.js';

export function renderLoginView(container, onLoginSuccess) {
  if (!container) return;

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
            <i class="fa-brands fa-google text-xs mr-1"></i> Google Cloud Sync
          </div>
        </div>

        <!-- Main Login Content -->
        <div class="login-welcome-box">
          <h2 class="text-sm font-extrabold text-slate-800 text-center mb-1">
            Welcome to PennyWise
          </h2>
          <p class="text-xs text-muted text-center mb-4 leading-relaxed">
            Sign in with your Google account to access your personal bank envelopes, monthly salary allocations, and cloud-synced budget records.
          </p>

          <!-- Feature Highlights -->
          <div class="login-features-list mb-4">
            <div class="login-feature-item">
              <div class="feature-icon"><i class="fa-solid fa-shield-halved"></i></div>
              <div class="feature-text">
                <span class="feature-title">Secure & Private</span>
                <span class="feature-desc">Your financial records are tied strictly to your Google account</span>
              </div>
            </div>
            <div class="login-feature-item">
              <div class="feature-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
              <div class="feature-text">
                <span class="feature-title">Real-Time Cloud Sync</span>
                <span class="feature-desc">Seamlessly synchronize across mobile, tablet, and desktop</span>
              </div>
            </div>
            <div class="login-feature-item">
              <div class="feature-icon"><i class="fa-solid fa-vault"></i></div>
              <div class="feature-text">
                <span class="feature-title">Bank Envelope Budgeting</span>
                <span class="feature-desc">Track Affin, Maybank, Setel, CIMB, and other bank commitments</span>
              </div>
            </div>
          </div>

          <!-- Error Alert Banner (Hidden by default) -->
          <div id="login-error-alert" class="login-error-box" style="display: none;">
            <i class="fa-solid fa-circle-exclamation text-coral mr-2"></i>
            <span id="login-error-text" class="text-xs"></span>
          </div>

          <!-- Primary Google Sign-In Button -->
          <button id="btn-google-signin" class="btn-google-social w-full">
            <svg class="google-icon" width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span id="btn-google-text">Continue with Google</span>
          </button>
        </div>

        <!-- Footer Notice -->
        <div class="login-footer">
          <i class="fa-solid fa-lock text-xs text-primary"></i>
          <span>Protected by Firebase Authentication.</span>
        </div>
      </div>
    </div>
  `;

  // Bind Google Sign-in Click
  const btnGoogle = document.getElementById('btn-google-signin');
  const btnText = document.getElementById('btn-google-text');
  const errorBox = document.getElementById('login-error-alert');
  const errorText = document.getElementById('login-error-text');

  btnGoogle?.addEventListener('click', async () => {
    // Hide previous error
    if (errorBox) errorBox.style.display = 'none';

    // Set Loading State
    btnGoogle.disabled = true;
    btnGoogle.style.opacity = '0.8';
    if (btnText) {
      btnText.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Signing in with Google...';
    }

    try {
      const user = await authService.signInWithGoogle();
      if (user) {
        showToast(`Welcome, ${user.displayName}!`, 'success');
        onLoginSuccess?.(user);
      }
    } catch (err) {
      console.warn('Login attempt notification:', err.message);
      if (errorBox && errorText) {
        errorText.textContent = err.message;
        errorBox.style.display = 'flex';
      }
      showToast(err.message, 'error');
    } finally {
      btnGoogle.disabled = false;
      btnGoogle.style.opacity = '1';
      if (btnText) {
        btnText.textContent = 'Continue with Google';
      }
    }
  });
}
