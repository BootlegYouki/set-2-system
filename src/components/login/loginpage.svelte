<script>

  // Material Web Components removed - using custom components with Material Design styling
  import './loginpage.css';
  import { onMount } from 'svelte';
  import { validateIdNumber, validatePassword } from './js/validation.js';
  import { getCurrentTheme, toggleTheme } from './js/theme.js';
  import { handleLogin } from './js/authHelpers.js';

  // Svelte 5 runes for state management
  let idNumber = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let showPassword = $state(false);
  let errors = $state({ idNumber: '', password: '', general: '' });
  
  // Forgot password state
  let showForgotPassword = $state(false);
  let forgotPasswordStep = $state(1); // 1: Email, 2: Code, 3: New Password
  let email = $state('');
  let resetToken = $state('');
  let verificationCode = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let showNewPassword = $state(false);
  let showConfirmPassword = $state(false);
  let successMessage = $state('');
  let attemptsRemaining = $state(5);
  
  // Theme state (sync with already-set theme from app.html)
  let isDarkMode = $state(false);

  // Sync component state with the theme set in app.html
  onMount(() => {
    const currentTheme = getCurrentTheme();
    isDarkMode = currentTheme === 'dark';
  });

  // Toggle theme mode
  function toggleDarkMode() {
    const newTheme = toggleTheme();
    isDarkMode = newTheme === 'dark';
  }
  
  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Reset errors
    errors = { idNumber: '', password: '', general: '' };
    
    // Validate inputs
    const idNumberError = validateIdNumber(idNumber);
    const passwordError = validatePassword(password);
    
    if (idNumberError || passwordError) {
      errors = { idNumber: idNumberError, password: passwordError, general: '' };
      return;
    }
    
    isLoading = true;
    
    try {
      await handleLogin({ accountNumber: idNumber, password });
    } catch (error) {
      errors = { ...errors, general: error.message };
    } finally {
      isLoading = false;
    }
  };

  // Handle input changes with real-time validation
  const handleIdNumberChange = (event) => {
    idNumber = event.target.value;
    if (errors.idNumber) {
      errors = { ...errors, idNumber: validateIdNumber(idNumber) };
    }
  };

  const handlePasswordChange = (event) => {
    password = event.target.value;
    if (errors.password) {
      errors = { ...errors, password: validatePassword(password) };
    }
  };

  // Handle Enter key press in form fields
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  // Toggle forgot password view
  function toggleForgotPassword() {
    showForgotPassword = !showForgotPassword;
    if (!showForgotPassword) {
      // Reset forgot password form
      forgotPasswordStep = 1;
      email = '';
      resetToken = '';
      verificationCode = '';
      newPassword = '';
      confirmPassword = '';
      errors = { idNumber: '', password: '', general: '' };
      successMessage = '';
      attemptsRemaining = 5;
    }
  }

  // Handle verification code input (only allow numbers, max 6 digits)
  function handleCodeChange(e) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    verificationCode = value;
  }

  // Email validation
  function validateEmail(emailValue) {
    if (!emailValue) {
      return 'Email address is required';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue)) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  // Code validation
  function validateCode(code) {
    if (!code) {
      return 'Verification code is required';
    }
    if (!/^\d{6}$/.test(code)) {
      return 'Code must be 6 digits';
    }
    return '';
  }

  // Password validation for forgot password
  function validateNewPassword(pwd) {
    if (!pwd) {
      return 'Password is required';
    }
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  // Handle Step 1: Request reset code
  async function handleRequestCode(event) {
    event.preventDefault();
    errors = { idNumber: '', password: '', general: '' };
    successMessage = '';

    const emailError = validateEmail(email);
    if (emailError) {
      errors = { ...errors, general: emailError };
      return;
    }

    isLoading = true;

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }

      resetToken = data.resetToken;
      successMessage = 'A verification code has been sent to your email address.';
      forgotPasswordStep = 2;
    } catch (error) {
      errors = { ...errors, general: error.message };
    } finally {
      isLoading = false;
    }
  }

  // Handle Step 2: Verify code
  async function handleVerifyCode(event) {
    event.preventDefault();
    errors = { idNumber: '', password: '', general: '' };
    successMessage = '';

    const codeError = validateCode(verificationCode);
    if (codeError) {
      errors = { ...errors, general: codeError };
      return;
    }

    isLoading = true;

    try {
      const response = await fetch('/api/forgot-password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, code: verificationCode })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.attemptsRemaining !== undefined) {
          attemptsRemaining = data.attemptsRemaining;
        }
        throw new Error(data.error || 'Invalid verification code');
      }

      successMessage = 'Code verified! Please enter your new password.';
      forgotPasswordStep = 3;
    } catch (error) {
      errors = { ...errors, general: error.message };
    } finally {
      isLoading = false;
    }
  }

  // Handle Step 3: Reset password
  async function handleResetPassword(event) {
    event.preventDefault();
    errors = { idNumber: '', password: '', general: '' };
    successMessage = '';

    const passwordError = validateNewPassword(newPassword);
    if (passwordError) {
      errors = { ...errors, general: passwordError };
      return;
    }

    if (newPassword !== confirmPassword) {
      errors = { ...errors, general: 'Passwords do not match' };
      return;
    }

    isLoading = true;

    try {
      const response = await fetch('/api/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, code: verificationCode, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      successMessage = 'Password reset successfully! Redirecting to login...';
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        toggleForgotPassword();
      }, 2000);
    } catch (error) {
      errors = { ...errors, general: error.message };
    } finally {
      isLoading = false;
    }
  }


  // Resend code
  async function resendCode() {
    verificationCode = '';
    attemptsRemaining = 5;
    await handleRequestCode({ preventDefault: () => {} });
  }
</script>

<div class="login-container">
  <!-- Theme toggle button -->
  <button 
    class="theme-toggle-btn" 
    onclick={toggleDarkMode}
    aria-label="Toggle dark mode"
  >
    <span class="material-symbols-outlined">
      {isDarkMode ? 'light_mode' : 'dark_mode'}
    </span>
  </button>
  
  <!-- Login/Forgot Password Form Side (Left) -->
  <div class="left-side">
    {#if !showForgotPassword}
      <!-- Login Form -->
      <div class="login-header">
        <h1 class="login-title">Login</h1>
        <h2 class="login-subtitle">Enter your account details</h2>
      </div>
      
      <form class="login-form" onsubmit={handleSubmit} novalidate autocomplete="off">
        <!-- ID Number Field -->
        <div class="form-field">
          <div class="custom-text-field {errors.idNumber ? 'error' : ''}">
            <span class="leading-icon material-symbols-outlined">badge</span>
            <input
              type="text"
              value={idNumber}
              oninput={handleIdNumberChange}
              onkeydown={handleKeyDown}
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              class="text-input"
              placeholder=" "
            />
            <label class="text-label" for="idnumber-input">ID Number</label>
          </div>
          {#if errors.idNumber}
            <div class="error-text">{errors.idNumber}</div>
          {/if}
        </div>

        <!-- Password Field -->
        <div class="form-field">
          <div class="custom-text-field {errors.password ? 'error' : ''}">
            <span class="leading-icon material-symbols-outlined">lock</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              oninput={handlePasswordChange}
              onkeydown={handleKeyDown}
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              class="text-input"
              placeholder=" "
            />
            <label class="text-label" for="password-input">Password</label>
            <button
              type="button"
              class="trailing-icon-button"
              onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                showPassword = !showPassword;
              }}
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  showPassword = !showPassword;
                }
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span class="material-symbols-outlined">{showPassword ? 'visibility' : 'visibility_off'}</span>
            </button>
          </div>
          {#if errors.password}
            <div class="error-text">{errors.password}</div>
          {/if}
        </div>

        <!-- Submit Button -->
        <button 
          id="login-submit-btn"
          type="submit" 
          class="custom-filled-button login-submit"
          disabled={isLoading}
          aria-label="Sign in"
        >
          {#if isLoading}
            <div class="login-loading-spinner"></div>
          {:else}
            <span>Login</span>
          {/if}
        </button>

        <!-- Forgot password -->
        <button 
          type="button" 
          id="forgot-password-btn" 
          class="custom-text-button forgot-password" 
          aria-label="forgot-password"
          onclick={toggleForgotPassword}
        >
          Forgot Password?
        </button>
      </form>
    {:else}
      <!-- Forgot Password Form -->
      <div class="login-header">
        <h1 class="login-title">
          {forgotPasswordStep === 1 ? 'Forgot Password?' : forgotPasswordStep === 2 ? 'Verify Code' : 'Reset Password'}
        </h1>
        <h2 class="login-subtitle">
          {forgotPasswordStep === 1
            ? 'Enter your email to receive a verification code'
            : forgotPasswordStep === 2
              ? 'Enter the 6-digit code sent to your email'
              : 'Create a new password for your account'}
        </h2>
      </div>

      <!-- Success/Error Messages -->
      {#if successMessage}
        <div class="success-message-box">
          <span class="material-symbols-outlined">check_circle</span>
          <span>{successMessage}</span>
        </div>
      {/if}

      {#if errors.general}
        <div class="error-message-box">
          <span class="material-symbols-outlined">error</span>
          <span>{errors.general}</span>
        </div>
      {/if}

      <!-- Step 1: Email Input -->
      {#if forgotPasswordStep === 1}
        <form class="login-form" onsubmit={handleRequestCode}>
          <div class="form-field">
            <div class="custom-text-field">
              <span class="leading-icon material-symbols-outlined">email</span>
              <input
                type="email"
                bind:value={email}
                autocomplete="email"
                class="text-input"
                placeholder=" "
                required
              />
              <label class="text-label">Email Address</label>
            </div>
          </div>

          <button 
            type="submit" 
            class="custom-filled-button login-submit"
            disabled={isLoading}
          >
            {#if isLoading}
              <div class="login-loading-spinner"></div>
            {:else}
              <span class="material-symbols-outlined">send</span>
              <span>Send Code</span>
            {/if}
          </button>
          <button class="back-to-login-btn" onclick={toggleForgotPassword} aria-label="Back to login">
            Back to Login
          </button>
        </form>
      {/if}

      <!-- Step 2: Code Verification -->
      {#if forgotPasswordStep === 2}
        <form class="login-form" onsubmit={handleVerifyCode}>
          <div class="form-field">
            <div class="custom-text-field">
              <span class="leading-icon material-symbols-outlined">pin</span>
              <input
                type="text"
                bind:value={verificationCode}
                oninput={handleCodeChange}
                maxlength="6"
                inputmode="numeric"
                autocomplete="one-time-code"
                class="text-input code-input"
                placeholder=" "
                required
              />
              <label class="text-label">Verification Code</label>
            </div>
            {#if attemptsRemaining < 5}
              <div class="info-text">Attempts remaining: {attemptsRemaining}</div>
            {/if}
          </div>

          <button 
            type="submit" 
            class="custom-filled-button login-submit"
            disabled={isLoading}
          >
            {#if isLoading}
              <div class="login-loading-spinner"></div>
            {:else}
              <span class="material-symbols-outlined">verified</span>
              <span>Verify Code</span>
            {/if}
          </button>

          <button 
            type="button" 
            class="custom-text-button forgot-password"
            onclick={resendCode}
            disabled={isLoading}
          >
            <span class="material-symbols-outlined">refresh</span>
            Resend Code
          </button>

          <button class="back-to-login-btn" onclick={toggleForgotPassword} aria-label="Back to login">
            Back to Login
          </button>
        </form>
      {/if}

      <!-- Step 3: New Password -->
      {#if forgotPasswordStep === 3}
        <form class="login-form" onsubmit={handleResetPassword}>
          <div class="form-field">
            <div class="custom-text-field">
              <span class="leading-icon material-symbols-outlined">lock_reset</span>
              <input
                type={showNewPassword ? 'text' : 'password'}
                bind:value={newPassword}
                autocomplete="new-password"
                class="text-input"
                placeholder=" "
                required
              />
              <label class="text-label">New Password</label>
              <button
                type="button"
                class="trailing-icon-button"
                onclick={(e) => {
                  e.preventDefault();
                  showNewPassword = !showNewPassword;
                }}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                <span class="material-symbols-outlined">{showNewPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
          </div>

          <div class="form-field">
            <div class="custom-text-field">
              <span class="leading-icon material-symbols-outlined">lock</span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                bind:value={confirmPassword}
                autocomplete="new-password"
                class="text-input"
                placeholder=" "
                required
              />
              <label class="text-label">Confirm Password</label>
              <button
                type="button"
                class="trailing-icon-button"
                onclick={(e) => {
                  e.preventDefault();
                  showConfirmPassword = !showConfirmPassword;
                }}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <span class="material-symbols-outlined">{showConfirmPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="custom-filled-button login-submit"
            disabled={isLoading}
          >
            {#if isLoading}
              <div class="login-loading-spinner"></div>
            {:else}
              <span class="material-symbols-outlined">check</span>
              <span>Reset Password</span>
            {/if}
          </button>
        </form>
      {/if}
    {/if}
  </div>
  
  <!-- Image Side (Right) -->
  <div class="right-side">
    <!-- Welcome text -->
    <div class="welcome-text">
      <h1 class="welcome-title">{showForgotPassword ? 'Password Reset' : 'Welcome'}</h1>
      <p class="welcome-subtitle">
        {showForgotPassword ? 'Recover your account securely' : 'Login to access your account'}
      </p>
    </div>
  </div>
</div>
