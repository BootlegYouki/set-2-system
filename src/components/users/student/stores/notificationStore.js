import { writable } from 'svelte/store';

/**
 * Shared notification store for managing notification count across components
 * This ensures the notification badge stays in sync between menu and notification section
 */
function createNotificationStore() {
  const { subscribe, set, update } = writable({
    unreadCount: 0,
    totalCount: 0,
    lastUpdated: null
  });

  return {
    subscribe,
    
    // Set the notification counts
    setCounts: (unreadCount, totalCount) => {
      update(state => ({
        unreadCount: unreadCount || 0,
        totalCount: totalCount || 0,
        lastUpdated: new Date()
      }));
    },
    
    // Increment unread count
    incrementUnread: () => {
      update(state => ({
        ...state,
        unreadCount: state.unreadCount + 1,
        totalCount: state.totalCount + 1,
        lastUpdated: new Date()
      }));
    },
    
    // Decrement unread count
    decrementUnread: () => {
      update(state => ({
        ...state,
        unreadCount: Math.max(0, state.unreadCount - 1),
        lastUpdated: new Date()
      }));
    },
    
    // Mark all as read
    markAllRead: () => {
      update(state => ({
        ...state,
        unreadCount: 0,
        lastUpdated: new Date()
      }));
    },
    
    // Reset store
    reset: () => {
      set({
        unreadCount: 0,
        totalCount: 0,
        lastUpdated: null
      });
    }
  };
}

export const notificationStore = createNotificationStore();

