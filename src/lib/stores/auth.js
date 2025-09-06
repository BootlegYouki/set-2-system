import { writable } from 'svelte/store';

// Authentication state store
function createAuthStore() {
  const { subscribe, set, update } = writable({
    isAuthenticated: false,
    userType: null, // 'student', 'teacher', 'registrar'
    userData: null
  });

  return {
    subscribe,
    // Login function
    login: (userType, userData) => {
      set({
        isAuthenticated: true,
        userType,
        userData
      });
    },
    // Logout function
    logout: () => {
      set({
        isAuthenticated: false,
        userType: null,
        userData: null
      });
    },
    // Update user data
    updateUserData: (userData) => {
      update(state => ({
        ...state,
        userData
      }));
    }
  };
}

export const authStore = createAuthStore();