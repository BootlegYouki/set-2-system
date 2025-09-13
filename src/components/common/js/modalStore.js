import { writable } from 'svelte/store';

// Modal store to manage modals globally
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
          size: 'medium',
          ...options
        }
      };
      
      update(modals => [...modals, modal]);
      
      return id;
    },
    // Close a specific modal
    close: (id) => {
      update(modals => modals.filter(m => m.id !== id));
    },
    // Close the topmost modal
    closeTop: () => {
      update(modals => {
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
      return modalStore.open('ConfirmModal', {
        title,
        message,
        onConfirm,
        onCancel
      }, {
        size: options.size || 'small',
        closable: false
      });
    },
    // Large confirm modal for complex content
    confirmLarge: (title, message, onConfirm, onCancel) => {
      return modalStore.open('ConfirmModal', {
        title,
        message,
        onConfirm,
        onCancel
      }, {
        size: 'large',
        closable: false
      });
    },
    alert: (title, message, onClose) => {
      return modalStore.open('AlertModal', {
        title,
        message,
        onClose
      }, {
        size: 'small'
      });
    },
    prompt: (title, message, defaultValue = '', onSubmit, onCancel) => {
      return modalStore.open('PromptModal', {
        title,
        message,
        defaultValue,
        inputValue: defaultValue,
        onSubmit,
        onCancel
      }, {
        size: 'medium'
      });
    }
  };
}

export const modalStore = createModalStore();