<script>
  import './notification.css';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authenticatedFetch } from '../../../../../routes/api/helper/api-helper.js';
  import { authStore } from '../../../../login/js/auth.js';

  // State variables
  let notifications = [];
  let loading = true;
  let error = null;
  let unreadCount = 0;
  let totalCount = 0;

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Notifications', icon: 'notifications' },
    { value: 'unread', label: 'Unread Only', icon: 'mark_email_unread' },
    { value: 'todo', label: 'To-Do Due Dates', icon: 'assignment' },
    { value: 'grade', label: 'Grades', icon: 'grade' },
    { value: 'document', label: 'Document Requests', icon: 'description' }
  ];

  // State
  let selectedFilter = 'all';
  let isFilterDropdownOpen = false;

  // API Functions
  async function fetchNotifications() {
    if (!browser) return;
    
    // Check if user is authenticated
    const authState = $authStore;
    if (!authState.isAuthenticated) {
      error = 'User not authenticated';
      loading = false;
      return;
    }
    
    loading = true;
    error = null;
    
    try {
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('type', selectedFilter);
      }
      params.append('limit', '50');
      params.append('offset', '0');
      
      const url = `/api/notifications?${params.toString()}`;
      const result = await authenticatedFetch(url);
      
      if (result.success) {
        notifications = result.data.notifications;
        unreadCount = result.data.unreadCount;
        totalCount = result.data.pagination.total;
      } else {
        throw new Error(result.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      error = err.message;
      notifications = [];
      unreadCount = 0;
      totalCount = 0;
    } finally {
      loading = false;
    }
  }

  async function updateNotificationStatus(id, isRead) {
    try {
      const result = await authenticatedFetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({
          id: id,
          action: isRead ? 'mark_read' : 'mark_unread'
        })
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update notification');
      }

      // Update local state
      notifications = notifications.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: isRead }
          : notification
      );

      // Update unread count
      if (isRead) {
        unreadCount = Math.max(0, unreadCount - 1);
      } else {
        unreadCount += 1;
      }
    } catch (err) {
      console.error('Error updating notification:', err);
      error = err.message;
    }
  }

  async function deleteNotificationAPI(id) {
    try {
      const result = await authenticatedFetch('/api/notifications', {
        method: 'DELETE',
        body: JSON.stringify({ id: id })
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete notification');
      }

      // Update local state
      const deletedNotification = notifications.find(n => n.id === id);
      notifications = notifications.filter(notification => notification.id !== id);
      totalCount = Math.max(0, totalCount - 1);
      
      if (deletedNotification && !deletedNotification.isRead) {
        unreadCount = Math.max(0, unreadCount - 1);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      error = err.message;
    }
  }

  async function markAllAsReadAPI() {
    try {
      const result = await authenticatedFetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'mark_all_read'
        })
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark all as read');
      }

      // Update local state
      notifications = notifications.map(notification => ({
        ...notification,
        isRead: true
      }));
      unreadCount = 0;
    } catch (err) {
      console.error('Error marking all as read:', err);
      error = err.message;
    }
  }

  async function clearAllReadAPI() {
    try {
      const result = await authenticatedFetch('/api/notifications', {
        method: 'DELETE',
        body: JSON.stringify({
          action: 'delete_read'
        })
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to clear read notifications');
      }

      // Update local state - remove all read notifications
      const readCount = notifications.filter(n => n.isRead).length;
      notifications = notifications.filter(notification => !notification.isRead);
      totalCount = Math.max(0, totalCount - readCount);
    } catch (err) {
      console.error('Error clearing read notifications:', err);
      error = err.message;
    }
  }

  // Component lifecycle
  onMount(() => {
    // Wait for auth store to be initialized before fetching
    let unsubscribe;
    unsubscribe = authStore.subscribe((authState) => {
      if (authState.isAuthenticated) {
        fetchNotifications();
        if (unsubscribe) {
          unsubscribe(); // Unsubscribe after first successful fetch
        }
      }
    });
  });

  // Functions
  function toggleFilterDropdown() {
    isFilterDropdownOpen = !isFilterDropdownOpen;
  }

  function selectFilter(filter) {
    selectedFilter = filter;
    isFilterDropdownOpen = false;
    fetchNotifications(); // Refetch with new filter
  }

  function handleClickOutside(event) {
    if (!event.target.closest('.filter-dropdown')) {
      isFilterDropdownOpen = false;
    }
  }

  function toggleNotificationRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      updateNotificationStatus(id, !notification.isRead);
    }
  }

  function deleteNotification(id) {
    deleteNotificationAPI(id);
  }

  function markAllAsRead() {
    markAllAsReadAPI();
  }

  function clearAllRead() {
    clearAllReadAPI();
  }

  // Helper functions

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  }

  function getFilterLabel(value) {
    const filter = filterOptions.find(f => f.value === value);
    return filter ? filter.label : 'All Notifications';
  }

  function getFilterIcon(value) {
    const filter = filterOptions.find(f => f.value === value);
    return filter ? filter.icon : 'notifications';
  }

  // Reactive statements
  $: filteredNotifications = (() => {
    if (selectedFilter === 'all') {
      return notifications;
    } else if (selectedFilter === 'unread') {
      return notifications.filter(n => !n.isRead);
    } else {
      return notifications.filter(n => n.type === selectedFilter);
    }
  })();
</script>

<svelte:window on:click={handleClickOutside} />

<div class="notification-container">
  <!-- Header Section -->
  <div class="notification-header">
    <div class="header-content">
      <h1 class="page-title">Notifications</h1>
      <p class="page-subtitle">
        Stay updated with your academic activities
        <span class="notification-badge">{unreadCount} unread</span>
      </p>
    </div>
  </div>

  <!-- Filter and Actions Section -->
  <div class="filter-actions-section">
    <div class="filter-section">
      <div class="filter-dropdown">
        <button class="filter-toggle" on:click={toggleFilterDropdown}>
          <div class="filter-toggle-content">
            <span class="material-symbols-outlined filter-icon">{getFilterIcon(selectedFilter)}</span>
            <span class="filter-label">{getFilterLabel(selectedFilter)}</span>
          </div>
          <span class="material-symbols-outlined dropdown-arrow" class:rotated={isFilterDropdownOpen}>expand_more</span>
        </button>
        
        {#if isFilterDropdownOpen}
          <div class="filter-dropdown-menu">
            {#each filterOptions as option}
              <button 
                class="filter-dropdown-item" 
                class:active={option.value === selectedFilter}
                on:click={() => selectFilter(option.value)}
              >
                <span class="material-symbols-outlined">{option.icon}</span>
                <span>{option.label}</span>
                {#if option.value === 'unread'}
                  <span class="count-badge">{unreadCount}</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="actions-section">
      {#if unreadCount > 0}
        <button class="notifications-action-btn mark-all-read" on:click={markAllAsRead} title="Mark All Read">
          <span class="material-symbols-outlined">done_all</span>
        </button>
      {/if}
      
      {#if notifications.some(n => n.isRead)}
        <button class="notifications-action-btn clear-read" on:click={clearAllRead} title="Clear Read">
          <span class="material-symbols-outlined">clear_all</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Notifications List -->
  <div class="notifications-section">
    {#if loading}
      <div class="loading-state">
        <div class="system-loader"></div>
        <p>Loading notifications...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <div class="error-icon">
          <span class="material-symbols-outlined">error</span>
        </div>
        <h3>Error Loading Notifications</h3>
        <p>{error}</p>
        <button class="retry-btn" on:click={fetchNotifications}>
          Reload
        </button>
      </div>
    {:else if filteredNotifications.length > 0}
      <div class="notifications-list">
        {#each filteredNotifications as notification, index (notification.id)}
          <div 
            class="notification-card {notification.isRead ? 'read' : 'unread'}"
            style="--card-index: {index}"
            on:click={() => toggleNotificationRead(notification.id)}
            on:keydown={(e) => e.key === 'Enter' && toggleNotificationRead(notification.id)}
            role="button"
            tabindex="0"
          >
            <!-- Notification Header -->
             <div class="notification-header-card">
               <h3 class="notification-title">{notification.title}</h3>
               <span class="notification-time">{formatTimestamp(notification.timestamp)}</span>
             </div>
            
            <!-- Notification Details -->
            <div class="notification-details">
              <p class="notification-message">{notification.message}</p>
              
              <!-- Notification Actions -->
              <div class="notification-actions">
                <button 
                  class="action-btn-small read-toggle"
                  on:click|stopPropagation={() => toggleNotificationRead(notification.id)}
                  title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
                >
                  <span class="material-symbols-outlined">
                    {notification.isRead ? 'mark_email_unread' : 'mark_email_read'}
                  </span>
                </button>
                
                <button 
                  class="action-btn-small delete-btn"
                  on:click|stopPropagation={() => deleteNotification(notification.id)}
                  title="Delete notification"
                >
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-notifications">
        <div class="no-notifications-icon">
          <span class="material-symbols-outlined">
            {selectedFilter === 'unread' ? 'mark_email_read' : 'notifications_off'}
          </span>
        </div>
        <h3>
          {selectedFilter === 'unread' ? 'All Caught Up!' : 'No Notifications'}
        </h3>
        <p>
          {selectedFilter === 'unread' 
            ? 'You have no unread notifications. Great job staying on top of things!' 
            : selectedFilter === 'all'
            ? 'You don\'t have any notifications yet.'
            : `No ${getFilterLabel(selectedFilter).toLowerCase()} notifications found.`
          }
        </p>
      </div>
    {/if}
  </div>
</div>