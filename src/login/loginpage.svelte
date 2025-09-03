<script>
  import '@material/web/button/filled-button.js';
  import '@material/web/button/text-button.js';
  import '@material/web/textfield/outlined-text-field.js';
  import '@material/web/checkbox/checkbox.js';
  import '@material/web/icon/icon.js';
  import '@material/web/iconbutton/icon-button.js';
  import '@material/web/progress/circular-progress.js';
  import '../lib/styles/design-system.css';

  // Svelte 5 runes for state management
  let email = $state('');
  let password = $state('');
  let rememberMe = $state(false);
  let isLoading = $state(false);
  let showPassword = $state(false);
  let errors = $state({ email: '', password: '', general: '' });
  let userType = $state('student'); // 'student' or 'staff'

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Handle successful login
      console.log('Login successful:', { email, userType, rememberMe });
      
    } catch (error) {
      errors = { ...errors, general: 'Login failed. Please check your credentials.' };
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
</script>

<div class="login-container">
  <div class="login-card">
    <!-- QCU Header -->
    <div class="login-header">
      <div class="qcu-logo">
        <img src="../src/lib/assets/qcu-logo.png" alt="QCU Logo" srcset="">
      </div>
      <h1 class="login-title">QCU Integrated Registrar System</h1>
      <p class="login-subtitle">Sign in to access your academic records</p>
    </div>

    <!-- User Type Selection -->
    <div class="user-type-selector">
      <md-filled-button 
        id="student-btn"
        class="user-type-btn {userType === 'student' ? 'active' : 'inactive'}"
        onclick={() => userType = 'student'}
        onkeydown={(e) => e.key === 'Enter' && (userType = 'student')}
        role="button"
        tabindex="0"
      >
        Student/Alumni
      </md-filled-button>
      <md-filled-button 
        id="staff-btn"
        class="user-type-btn {userType === 'staff' ? 'active' : 'inactive'}"
        onclick={() => userType = 'staff'}
        onkeydown={(e) => e.key === 'Enter' && (userType = 'staff')}
        role="button"
        tabindex="0"
      >
        Registrar Staff
      </md-filled-button>
    </div>

    <!-- Login Form -->
    <form class="login-form" onsubmit={handleSubmit}>
      <!-- Email Field -->
      <div class="form-field">
        <md-outlined-text-field
          label="Email Address"
          type="email"
          value={email}
          oninput={handleEmailChange}
          error={!!errors.email}
          error-text={errors.email}
          required
          autocomplete="email"
          class="w-full"
        >
          <md-icon slot="leading-icon">email</md-icon>
        </md-outlined-text-field>
      </div>

      <!-- Password Field -->
      <div class="form-field">
        <md-outlined-text-field
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          oninput={handlePasswordChange}
          error={!!errors.password}
          error-text={errors.password}
          required
          autocomplete="current-password"
          class="w-full"
        >
          <md-icon slot="leading-icon">lock</md-icon>
          <md-icon-button 
            id="password-toggle-btn"
            slot="trailing-icon"
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
            role="button"
            tabindex="0"
          >
            <md-icon>{showPassword ? 'visibility_off' : 'visibility'}</md-icon>
          </md-icon-button>
        </md-outlined-text-field>
      </div>

      <!-- Remember Me & Forgot Password -->
      <div class="form-options">
        <label class="remember-me" for="remember-checkbox">
          <md-checkbox 
            id="remember-checkbox"
            checked={rememberMe}
            onchange={(e) => rememberMe = e.target.checked}
          ></md-checkbox>
          <span>Remember me</span>
        </label>
        <md-text-button id="forgot-password-btn" class="forgot-password">
          Forgot Password?
        </md-text-button>
      </div>

      <!-- Error Message -->
      {#if errors.general}
        <div class="error-message" role="alert">
          <md-icon>error</md-icon>
          <span>{errors.general}</span>
        </div>
      {/if}

      <!-- Submit Button -->
      <md-filled-button 
        id="login-submit-btn"
        type="submit" 
        class="login-submit"
        disabled={isLoading}
      >
        {#if isLoading}
          <md-circular-progress indeterminate></md-circular-progress>
        {:else}
          <span>Sign In</span>
        {/if}
      </md-filled-button>
    </form>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
    background-color: var(--surface-container);
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    background-color: var(--md-sys-color-surface);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--md-sys-color-outline-variant);
  }

  .login-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  .qcu-logo {
    margin-bottom: var(--spacing-md);
  }

  .qcu-logo img {
    width: 100px;
    height: 100px;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
    margin: 0 auto;
  }

  .login-title {
    font-size: var(--md-sys-typescale-headline-large-size);
    font-weight: var(--md-sys-typescale-headline-large-weight);
    color: var(--md-sys-color-on-surface);
    margin: var(--spacing-md) 0 var(--spacing-sm) 0;
    line-height: 1.2;
  }

  .login-subtitle {
    font-size: var(--md-sys-typescale-body-large-size);
    color: var(--md-sys-color-on-surface-variant);
    margin: 0;
  }

  .user-type-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xl);
  }

  .user-type-btn {
    --md-filled-button-container-color: var(--md-sys-color-surface-variant);
    --md-filled-button-label-text-color: var(--md-sys-color-on-surface-variant);
  }

  .user-type-btn.active {
    --md-filled-button-container-color: var(--md-sys-color-primary);
    --md-filled-button-label-text-color: var(--md-sys-color-on-primary);
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .form-field {
    width: 100%;
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: var(--spacing-sm) 0;
  }

  .remember-me {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--md-sys-typescale-body-large-size);
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
  }

  .forgot-password {
    --md-text-button-label-text-color: var(--md-sys-color-primary);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
    border-radius: var(--radius-md);
    font-size: var(--md-sys-typescale-body-large-size);
  }

  .login-submit {
    width: 100%;
    height: 48px;
    margin-top: var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  /* Mobile Optimizations */
  @media (max-width: 480px) {
    .login-container {
      padding: var(--spacing-sm);
    }

    .login-card {
      padding: var(--spacing-xl);
    }

    .login-title {
      font-size: 24px;
    }

    .user-type-selector {
      grid-template-columns: 1fr;
      gap: var(--spacing-sm);
    }

    .form-options {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    /* Larger text fields for mobile */
    md-outlined-text-field {
      --md-outlined-text-field-container-height: 70px;
      --md-outlined-text-field-input-text-size: 18px;
      --md-outlined-text-field-label-text-size: 16px;
    }
  }

  /* Touch-friendly tap targets */
  md-filled-button,
  md-text-button,
  md-icon-button {
    min-height: 44px;
    min-width: 44px;
  }


  /* Loading state */
  md-circular-progress {
    --md-circular-progress-size: 20px;
  }
</style>