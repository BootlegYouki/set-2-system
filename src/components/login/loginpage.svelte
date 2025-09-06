<script>
  import '@material/web/button/filled-button.js';
  import '@material/web/button/text-button.js';
  import '@material/web/textfield/outlined-text-field.js';
  import '@material/web/checkbox/checkbox.js';
  import '@material/web/icon/icon.js';
  import '@material/web/iconbutton/icon-button.js';
  import '@material/web/progress/circular-progress.js';
  import '../../lib/styles/design-system.css';
  import './loginpage.css';
  import { authStore } from '../../lib/stores/auth.js';

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
      
      // Handle successful login - update auth store
      const userData = {
        name: email.split('@')[0], // Use email prefix as name for now
        id: userType === 'student' ? '2024-001234' : 'STAFF-001',
        email: email,
        profileImage: null
      };
      
      authStore.login(userType, userData);
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
    <div class="left-side">
      <h1>dito lalagay image</h1>
    </div>
    <div class="right-side">
      <!-- High School Header -->
      <div class="login-header">
        <h1 class="login-title">Integrated Registrar System</h1>
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
              <md-icon>{showPassword ? 'visibility' : 'visibility_off'}</md-icon>
            </md-icon-button>
          </md-outlined-text-field>
        </div>

        <!-- Remember Me Checkbox -->
        <div class="form-field remember-me-field">
          <label class="remember-me-label" for="remember-me-checkbox">
            <md-checkbox
              id="remember-me-checkbox"
              checked={rememberMe}
              onchange={(e) => (rememberMe = e.target.checked)}
            ></md-checkbox>
            <span>Remember me</span>
          </label>
        </div>

        <!-- Submit Button -->
        <md-filled-button 
          id="login-submit-btn"
          type="submit" 
          class="login-submit"
          disabled={isLoading}
          aria-label="Sign in"
        >
          {#if isLoading}
            <md-circular-progress indeterminate></md-circular-progress>
          {:else}
            <span>Sign in</span>
          {/if}
        </md-filled-button>

        <!-- Forgot password -->
        <md-text-button id="forgot-password-btn" class="forgot-password" aria-label="forgot-password">
          Forgot Password?
        </md-text-button>

        <!-- Error Message -->
        {#if errors.general}
          <div class="error-message" role="alert">
            <md-icon>error</md-icon>
            <span>{errors.general}</span>
          </div>
        {/if}
      </form>
    </div>
  </div>
</div>
