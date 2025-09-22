import { get } from 'svelte/store';
import { authStore } from '../../../components/login/js/auth.js';

/**
 * Enhanced fetch function that automatically includes user authentication headers
 */
export async function authenticatedFetch(url, options = {}) {
  const authState = get(authStore);
  
  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add user headers if authenticated
  if (authState.isAuthenticated && authState.userData) {
    defaultHeaders['x-user-id'] = authState.userData.id.toString();
    defaultHeaders['x-user-account-number'] = authState.userData.accountNumber;
    defaultHeaders['x-user-name'] = encodeURIComponent(authState.userData.name);
  }
  
  // Merge options with enhanced headers
  const enhancedOptions = {
    ...options,
    headers: defaultHeaders
  };
  
  const response = await fetch(url, enhancedOptions);
  
  // Parse JSON response
  const data = await response.json();
  
  // Throw error if response is not ok
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }
  
  return data;
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  get: async (url, options = {}) => {
    return authenticatedFetch(url, { ...options, method: 'GET' });
  },
  post: async (url, data, options = {}) => {
    return authenticatedFetch(url, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  },
  put: async (url, data, options = {}) => {
    return authenticatedFetch(url, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
  },
  delete: async (url, data, options = {}) => {
    return authenticatedFetch(url, { 
      ...options, 
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined
    });
  },
  patch: async (url, data, options = {}) => {
    return authenticatedFetch(url, { 
      ...options, 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    });
  }
};