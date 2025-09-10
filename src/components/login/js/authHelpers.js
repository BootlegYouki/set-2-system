import { authStore } from '../../../lib/stores/auth.js';
import { showSuccess, showError } from '../../../lib/stores/toastStore.js';

/**
 * Simulate API call with delay
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise} Promise that resolves after delay
 */
const simulateAPICall = (delay = 1000) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Handle user login
 * @param {Object} loginData - Login data object
 * @param {string} loginData.email - User email
 * @param {string} loginData.password - User password  
 * @param {string} loginData.userType - User type ('student' or 'staff')
 * @param {boolean} loginData.rememberMe - Remember me option
 * @returns {Promise<Object>} Promise that resolves with user data or rejects with error
 */
export const handleLogin = async ({ email, password, userType, rememberMe }) => {
  try {
    // Simulate API call
    await simulateAPICall(1000);
    
    // Create user data (this would typically come from the API)
    const userData = {
      name: email.split('@')[0], // Use email prefix as name for now
      id: userType === 'student' ? '2024-001234' : 'STAFF-001',
      email: email,
      profileImage: null
    };
    
    // Update auth store
    authStore.login(userType, userData);
    
    // Show success message
    showSuccess('Login successful! Welcome back.');
    
    console.log('Login successful:', { email, userType, rememberMe });
    
    return userData;
  } catch (error) {
    showError('Login failed. Please check your credentials and try again.');
    throw new Error('Login failed. Please check your credentials.');
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
