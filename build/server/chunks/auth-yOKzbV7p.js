import { F as writable, Q as get } from './index-B9K8BHQO.js';

function createToastStore() {
  const { subscribe, update } = writable([]);
  return {
    subscribe,
    // Add a new toast
    add: (message, type = "success", duration = 3e3) => {
      const id = Date.now() + Math.random();
      const toast = {
        id,
        message,
        type,
        duration
      };
      update((toasts) => [...toasts, toast]);
      if (duration > 0) {
        setTimeout(() => {
          setTimeout(() => {
            update((toasts) => toasts.filter((t) => t.id !== id));
          }, 300);
        }, duration);
      }
      return id;
    },
    // Remove a specific toast
    remove: (id) => {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },
    // Clear all toasts
    clear: () => {
      update(() => []);
    },
    // Convenience methods
    success: (message, duration = 3e3) => {
      return toastStore.add(message, "success", duration);
    },
    error: (message, duration = 4e3) => {
      return toastStore.add(message, "error", duration);
    },
    warning: (message, duration = 3500) => {
      return toastStore.add(message, "warning", duration);
    },
    info: (message, duration = 3e3) => {
      return toastStore.add(message, "info", duration);
    }
  };
}
const toastStore = createToastStore();
toastStore.add;
function createModalStore() {
  const { subscribe, update } = writable([]);
  return {
    subscribe,
    // Open a new modal
    open: (component, props = {}, options = {}) => {
      const id = Date.now() + Math.random();
      const modal = {
        id,
        component,
        props,
        options: {
          closable: true,
          backdrop: true,
          size: "medium",
          ...options
        }
      };
      update((modals) => [...modals, modal]);
      return id;
    },
    // Close a specific modal
    close: (id) => {
      update((modals) => modals.filter((m) => m.id !== id));
    },
    // Close the topmost modal
    closeTop: () => {
      update((modals) => {
        if (modals.length > 0) {
          return modals.slice(0, -1);
        }
        return modals;
      });
    },
    // Close all modals
    closeAll: () => {
      update(() => []);
    },
    // Convenience methods for different modal types
    confirm: (title, message, onConfirm, onCancel, options = {}) => {
      return modalStore.open("ConfirmModal", {
        title,
        message,
        onConfirm,
        onCancel,
        onDelete: options.onDelete,
        deleteText: options.deleteText
      }, {
        size: options.size || "small",
        closable: options.closable !== false
      });
    },
    // Large confirm modal for complex content
    confirmLarge: (title, message, onConfirm, onCancel) => {
      return modalStore.open("ConfirmModal", {
        title,
        message,
        onConfirm,
        onCancel
      }, {
        size: "large",
        closable: false
      });
    },
    alert: (title, message, onClose) => {
      return modalStore.open("AlertModal", {
        title,
        message,
        onClose
      }, {
        size: "small"
      });
    },
    prompt: (title, message, placeholder = "", onSubmit, onCancel) => {
      return modalStore.open("PromptModal", {
        title,
        message,
        placeholder,
        defaultValue: "",
        inputValue: "",
        onSubmit,
        onCancel
      }, {
        size: "medium"
      });
    },
    // Form modal with two input fields
    form: (title, message, field1Config, field2Config, onSubmit, onCancel, onDelete, options = {}) => {
      return modalStore.open("FormModal", {
        title,
        message,
        field1Label: field1Config.label || "Field 1",
        field1Type: field1Config.type || "text",
        field1Placeholder: field1Config.placeholder || "Enter value...",
        field1Value: field1Config.value || "",
        field1Min: field1Config.min,
        field1Max: field1Config.max,
        field2Label: field2Config.label || "Field 2",
        field2Type: field2Config.type || "text",
        field2Placeholder: field2Config.placeholder || "Enter value...",
        field2Value: field2Config.value || "",
        field2Min: field2Config.min,
        field2Max: field2Config.max,
        onSubmit,
        onCancel,
        onDelete
      }, {
        size: options.size || "medium",
        closable: options.closable !== false
      });
    }
  };
}
const modalStore = createModalStore();
function getInitialState() {
  return {
    isAuthenticated: false,
    userType: null,
    // 'student', 'teacher', 'admin'
    userData: null
  };
}
function createAuthStore() {
  const initialState = getInitialState();
  const { subscribe, set, update } = writable(initialState);
  return {
    subscribe,
    // Login function
    login: (userType, userData) => {
      const newState = {
        isAuthenticated: true,
        userType,
        userData
      };
      set(newState);
    },
    // Logout function
    logout: async () => {
      const currentState = get(authStore);
      if (currentState.isAuthenticated && currentState.userData) {
        try {
          await fetch("/api/activity-logs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              activity_type: "user_logout",
              user_id: currentState.userData.id,
              user_account_number: currentState.userData.accountNumber,
              activity_data: {
                full_name: currentState.userData.name,
                account_type: currentState.userType
              }
            })
          });
        } catch (error) {
          console.error("Failed to log logout activity:", error);
        }
      }
      const newState = {
        isAuthenticated: false,
        userType: null,
        userData: null
      };
      set(newState);
    },
    // Update user data
    updateUserData: (userData) => {
      update((state) => {
        const newState = {
          ...state,
          userData
        };
        return newState;
      });
    },
    // Initialize from storage (called on app start)
    initialize: () => {
      const storedState = getInitialState();
      set(storedState);
    }
  };
}
const authStore = createAuthStore();

export { modalStore as m, toastStore as t };
//# sourceMappingURL=auth-yOKzbV7p.js.map
