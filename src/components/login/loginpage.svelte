<script>

  // Material Web Components removed - using custom components with Material Design styling
  import './loginpage.css';
  import { onMount } from 'svelte';
  import { validateEmail, validatePassword } from './js/validation.js';
  import { getCurrentTheme, toggleTheme } from './js/theme.js';
  import { handleLogin } from './js/authHelpers.js';

  // Svelte 5 runes for state management
  let email = $state('');
  let password = $state('');
  let rememberMe = $state(false);
  let isLoading = $state(false);
  let showPassword = $state(false);
  let errors = $state({ email: '', password: '', general: '' });
  
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
    errors = { email: '', password: '', general: '' };
    
    // Validate inputs
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      errors = { email: emailError, password: passwordError, general: '' };
      return;
    }
    
    isLoading = true;
    
    try {
      await handleLogin({ email, password, rememberMe });
    } catch (error) {
      errors = { ...errors, general: error.message };
    } finally {
      isLoading = false;
    }
  };

  // Handle input changes with real-time validation
  const handleEmailChange = (event) => {
    email = event.target.value;
    if (errors.email) {
      errors = { ...errors, email: validateEmail(email) };
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
  
  <div class="login-card">
    <div class="left-side">
      <h1>dito lalagay image</h1>
    </div>
    <div class="right-side">
      <!-- High School Header -->
      <div class="login-header">
        <h1 class="login-title">Integrated Admin System</h1>
      </div>
      <!-- Login Form -->
      <form class="login-form" onsubmit={handleSubmit} novalidate>
        <!-- Email Field -->
        <div class="form-field">
          <div class="custom-text-field {errors.email ? 'error' : ''}">
            <span class="leading-icon material-symbols-outlined">email</span>
            <input
                 type="email"
                 value={email}
                 oninput={handleEmailChange}
                 onkeydown={handleKeyDown}
                 autocomplete="email"
                 class="text-input"
                 placeholder=" "
               />
            <label class="text-label" for="email-input">Email Address</label>
          </div>
          {#if errors.email}
            <div class="error-text">{errors.email}</div>
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
                 autocomplete="current-password"
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

        <!-- Remember Me Checkbox -->
        <div class="form-field remember-me-field">
          <label class="remember-me-label" for="remember-me-checkbox">
            <input
              type="checkbox"
              id="remember-me-checkbox"
              class="custom-checkbox"
              checked={rememberMe}
              onchange={(e) => (rememberMe = e.target.checked)}
            />
            <span class="checkbox-checkmark"></span>
            <span>Remember me</span>
          </label>
        </div>

        <!-- Submit Button -->
        <button 
          id="login-submit-btn"
          type="submit" 
          class="custom-filled-button login-submit"
          disabled={isLoading}
          aria-label="Sign in"
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        >
          {#if isLoading}
            <div class="loading-spinner"></div>
          {:else}
            <span>Sign in</span>
          {/if}
        </button>

        <!-- Forgot password -->
        <button type="button" id="forgot-password-btn" class="custom-text-button forgot-password" aria-label="forgot-password">
          Forgot Password?
        </button>

      </form>
    </div>
  </div>
</div>
