/**
 * Email validation function
 * @param {string} email - Email to validate
 * @returns {string} Error message or empty string if valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

/**
 * Password validation function
 * @param {string} password - Password to validate
 * @returns {string} Error message or empty string if valid
 */
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  return '';
};

/**
 * Generic field validation
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {Object} rules - Validation rules object
 * @returns {string} Error message or empty string if valid
 */
export const validateField = (value, fieldName, rules = {}) => {
  if (rules.required && !value) {
    return `${fieldName} is required`;
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters long`;
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must be no more than ${rules.maxLength} characters long`;
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.patternMessage || `${fieldName} format is invalid`;
  }
  
  return '';
};
