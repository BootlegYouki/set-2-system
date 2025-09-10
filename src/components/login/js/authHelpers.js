import { authStore } from './auth.js';
import { showSuccess, showError } from '../../common/js/toastStore.js';

/**
 * Simulate API call with delay
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise} Promise that resolves after delay
 */
const simulateAPICall = (delay) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Predefined test accounts
const testAccounts = {
  'student@school.edu': {
    password: 'student123',
    userType: 'student',
    userData: {
      name: 'John Student',
      id: '2024-001234',
      email: 'student@school.edu',
      profileImage: null
    }
  },
  'teacher@school.edu': {
    password: 'teacher123',
    userType: 'teacher',
    userData: {
      name: 'Jane Teacher',
      id: 'TEACH-001',
      email: 'teacher@school.edu',
      profileImage: null
    }
  },
  'registrar@school.edu': {
    password: 'registrar123',
    userType: 'registrar',
    userData: {
      name: 'Admin Registrar',
      id: 'REG-001',
      email: 'registrar@school.edu',
      profileImage: null
    }
  }
};

/**
 * Handle user login
 * @param {Object} loginData - Login data object
 * @param {string} loginData.email - User email
 * @param {string} loginData.password - User password  
 * @param {boolean} loginData.rememberMe - Remember me option
 * @returns {Promise<Object>} Promise that resolves with user data or rejects with error
 */
export const handleLogin = async ({ email, password, rememberMe }) => {
  try {
    // Simulate API call
    await simulateAPICall(500);
    
    // Check if the email exists in test accounts
    const account = testAccounts[email.toLowerCase()];
    
    if (!account ) {
      throw new Error('Invalid credentials. Please try again.');
    }
    
    // Verify password
    if (account.password !== password) {
      throw new Error('Invalid credentials. Please try again.');
    }
    
    // Use the account's user type and data
    const { userType: accountUserType, userData } = account;
    
    // Update auth store with the correct user type from the account
    authStore.login(accountUserType, userData);
    
    // Show success message
    showSuccess(`Login successful! Welcome back, ${userData.name}.`);
    
    console.log('Login successful:', { email, userType: accountUserType, rememberMe });
    
    return userData;
  } catch (error) {
    showError(error.message);
    throw error;
  }
};

/**
 * Create form submission handler
 * @param {Object} formState - Form state object containing email, password, etc.
 * @param {Function} setErrors - Function to set form errors
 * @param {Function} setLoading - Function to set loading state
 * @param {Function} validateEmail - Email validation function
 * @param {Function} validatePassword - Password validation function
 * @returns {Function} Form submit handler function
 */
export const createSubmitHandler = (formState, setErrors, setLoading, validateEmail, validatePassword) => {
  return async (event) => {
    event.preventDefault();
    
    const { email, password, userType, rememberMe } = formState;
    
    // Reset errors
    setErrors({ email: '', password: '', general: '' });
    
    // Validate inputs
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError, general: '' });
      return;
    }
    
    setLoading(true);
    
    try {
      await handleLogin({ email, password, userType, rememberMe });
    } catch (error) {
      setErrors(prev => ({ ...prev, general: error.message }));
    } finally {
      setLoading(false);
    }
  };
};
