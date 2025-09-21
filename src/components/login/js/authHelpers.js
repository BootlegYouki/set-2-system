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
  'admin@school.edu': {
    password: 'admin123',
    userType: 'admin',
    userData: {
      name: 'System Admin',
      id: 'ADM001',
      email: 'admin@school.edu',
      profileImage: null
    }
  }
};

/**
 * Handle user login
 * @param {Object} loginData - Login data object
 * @param {string} loginData.accountNumber - User account number
 * @param {string} loginData.password - User password  
 * @param {boolean} loginData.rememberMe - Remember me option
 * @returns {Promise<Object>} Promise that resolves with user data or rejects with error
 */
export const handleLogin = async ({ accountNumber, password, rememberMe }) => {
  try {
    // Make API call to authenticate with account number
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accountNumber, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store user data in localStorage
      const userData = {
        id: data.user.id,
        name: data.user.name,
        accountNumber: data.user.accountNumber,
        accountType: data.user.accountType,
        isAuthenticated: true
      };
      
      // Update auth store with the user type and data
      authStore.login(userData.accountType, userData);
      
      // Show success message
      showSuccess(`Login successful! Welcome back, ${userData.name}.`);
      
      console.log('Login successful:', { accountNumber, userType: userData.accountType, rememberMe });
      
      return userData;
    } else {
      throw new Error(data.error || 'Invalid credentials. Please try again.');
    }
  } catch (error) {
    const errorMessage = error.message || 'Network error. Please try again.';
    showError(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Create form submission handler
 * @param {Object} formState - Form state object containing accountNumber, password, etc.
 * @param {Function} setErrors - Function to set form errors
 * @param {Function} setLoading - Function to set loading state
 * @param {Function} validateAccountNumber - Account number validation function
 * @param {Function} validatePassword - Password validation function
 * @returns {Function} Form submit handler function
 */
export const createSubmitHandler = (formState, setErrors, setLoading, validateAccountNumber, validatePassword) => {
  return async (event) => {
    event.preventDefault();
    
    const { accountNumber, password, userType, rememberMe } = formState;
    
    // Reset errors
    setErrors({ accountNumber: '', password: '', general: '' });
    
    // Validate inputs
    const accountNumberError = validateAccountNumber(accountNumber);
    const passwordError = validatePassword(password);
    
    if (accountNumberError || passwordError) {
      setErrors({ accountNumber: accountNumberError, password: passwordError, general: '' });
      return;
    }
    
    setLoading(true);
    
    try {
      await handleLogin({ accountNumber, password, userType, rememberMe });
    } catch (error) {
      setErrors(prev => ({ ...prev, general: error.message }));
    } finally {
      setLoading(false);
    }
  };
};
