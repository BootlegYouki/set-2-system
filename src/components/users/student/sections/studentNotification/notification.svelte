<script>
  import './notification.css';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authenticatedFetch } from '../../../../../routes/api/helper/api-helper.js';
  import { authStore } from '../../../../login/js/auth.js';
  import { notificationStore } from '../../stores/notificationStore.js';
  import { modalStore } from '../../../../common/js/modalStore.js';
  import { toastStore } from '../../../../common/js/toastStore.js';

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
    { value: 'grade', label: 'Grades', icon: 'grade' },
    { value: 'document', label: 'Document Requests', icon: 'description' }
  ];

  // State
  let selectedFilter = 'all';
  let isFilterDropdownOpen = false;


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
    } else {
      console.warn('Notification not found for toggle:', id);
    }
  }

  function deleteNotification(id) {
    const notification = notifications.find(n => n.id === id);
    const notificationTitle = notification ? notification.title : 'this notification';
    
    modalStore.confirm(
      'Delete Notification',
      `<p>Are you sure you want to delete <strong>"${notificationTitle}"</strong>?</p>
       <p style="margin-top: 8px; color: var(--md-sys-color-on-surface-variant); font-size: 0.9rem;">This action cannot be undone.</p>`,
      async () => {
        await deleteNotificationAPI(id);
        toastStore.success('Notification deleted successfully');
      },
      () => {
        // Do nothing on cancel
      },
      { size: 'small' }
    );
  }

  function markAllAsRead() {
    markAllAsReadAPI();
  }

  function clearAllRead() {
    const readCount = notifications.filter(n => n.isRead).length;
    
    modalStore.confirm(
      'Clear All Read Notifications',
      `<p>Are you sure you want to delete all <strong>${readCount}</strong> read notification${readCount !== 1 ? 's' : ''}?</p>
       <p style="margin-top: 8px; color: var(--md-sys-color-on-surface-variant); font-size: 0.9rem;">This action cannot be undone.</p>`,
      async () => {
        await clearAllReadAPI();
        toastStore.success(`${readCount} read notification${readCount !== 1 ? 's' : ''} cleared successfully`);
      },
      () => {
        // Do nothing on cancel
      },
      { size: 'small' }
    );
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

  // API Functions
  async function fetchNotifications() {
    try {
      loading = true;
      error = null;
      
      const user = $authStore.userData;
      console.log('Auth store userData:', user);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const params = new URLSearchParams({
        student_id: user.id,
        ...(selectedFilter !== 'all' && selectedFilter !== 'unread' && { type: selectedFilter }),
        ...(selectedFilter === 'unread' && { is_read: 'false' })
      });

      console.log('Fetching notifications with params:', params.toString());
      const response = await authenticatedFetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      
      // The API returns data in data.data structure and notifications are already transformed
      const responseData = data.data || data;
      notifications = responseData.notifications || [];
      
      console.log('Transformed notifications:', notifications);
      
      unreadCount = responseData.unreadCount || 0;
      totalCount = responseData.pagination?.total || notifications.length;
      
      // Update the shared notification store
      notificationStore.setCounts(unreadCount, totalCount);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      error = err.message;
      notifications = [];
    } finally {
      loading = false;
    }
  }

  async function updateNotificationStatus(id, isRead) {
    try {
      const user = $authStore.userData;
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await authenticatedFetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: id,
          action: isRead ? 'mark_read' : 'mark_unread'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update notification: ${response.status}`);
      }

      // Update local state
      notifications = notifications.map(n => 
        n.id === id ? { ...n, isRead } : n
      );
      
      // Update unread count
      if (isRead) {
        unreadCount = Math.max(0, unreadCount - 1);
        notificationStore.decrementUnread();
      } else {
        unreadCount += 1;
        notificationStore.incrementUnread();
      }

    } catch (err) {
      console.error('Error updating notification status:', err);
      error = err.message;
    }
  }

  async function deleteNotificationAPI(id) {
    try {
      const user = $authStore.userData;
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await authenticatedFetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }

      // Remove from local state
      const deletedNotification = notifications.find(n => n.id === id);
      notifications = notifications.filter(n => n.id !== id);
      
      // Update counts
      if (deletedNotification && !deletedNotification.isRead) {
        unreadCount = Math.max(0, unreadCount - 1);
        notificationStore.decrementUnread();
      }
      totalCount = Math.max(0, totalCount - 1);
      notificationStore.setCounts(unreadCount, totalCount);

    } catch (err) {
      console.error('Error deleting notification:', err);
      error = err.message;
    }
  }

  async function markAllAsReadAPI() {
    try {
      const user = $authStore.userData;
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await authenticatedFetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'mark_all_read'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all as read: ${response.status}`);
      }

      // Update local state
      notifications = notifications.map(n => ({ ...n, isRead: true }));
      unreadCount = 0;
      
      // Update the shared notification store
      notificationStore.markAllRead();

    } catch (err) {
      console.error('Error marking all as read:', err);
      error = err.message;
    }
  }

  async function clearAllReadAPI() {
    try {
      const user = $authStore.userData;
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await authenticatedFetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete_read'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to clear read notifications: ${response.status}`);
      }

      // Remove read notifications from local state
      const readCount = notifications.filter(n => n.isRead).length;
      notifications = notifications.filter(n => !n.isRead);
      totalCount = Math.max(0, totalCount - readCount);
      
      // Update the shared notification store
      notificationStore.setCounts(unreadCount, totalCount);

    } catch (err) {
      console.error('Error clearing read notifications:', err);
      error = err.message;
    }
  }

  // Initialize component
  onMount(() => {
    if (browser && $authStore.userData?.id) {
      fetchNotifications();
    }
  });

  // Reactive statements
  $: filteredNotifications = (() => {
    // Ensure notifications is always an array
    if (!Array.isArray(notifications)) {
      return [];
    }
    
    if (selectedFilter === 'all') {
      return notifications;
    } else if (selectedFilter === 'unread') {
      return notifications.filter(n => !n.isRead);
    } else {
      return notifications.filter(n => n.type === selectedFilter);
    }
  })();
  
  // Animation key to trigger stagger animation on data change
  let animationKey = 0;
  $: {
    // Increment key whenever filter or notifications change
    selectedFilter;
    filteredNotifications;
    animationKey++;
  }
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
      {#key animationKey}
        <div class="notifications-list">
          {#each filteredNotifications as notification, index (notification.id)}
            <div 
              class="notification-card {notification.isRead ? 'read' : 'unread'}"
              style="--card-index: {index};"
            >
              <!-- Notification Header -->
               <div class="notification-header-card">
                 <h3 class="notification-title">{notification.title}</h3>
                 <span class="notification-time">{formatTimestamp(notification.timestamp)}</span>
               </div>
              
              <!-- Notification Details -->
              <div class="notification-details">
                <div class="notification-content">
                  <p class="notification-message">{notification.message}</p>
                  
                  <!-- Document Request Specific Info -->
                  {#if notification.type === 'document_request'}
                    {#if notification.adminNote}
                      <div class="admin-note">
                        <span class="material-symbols-outlined">note</span>
                        <div class="note-content">
                          <span class="note-label">Admin Note:</span>
                          <span class="note-text">{notification.adminNote}</span>
                        </div>
                      </div>
                    {/if}
                    {#if notification.rejectionReason}
                      <div class="rejection-reason">
                        <span class="material-symbols-outlined">error</span>
                        <div class="reason-content">
                          <span class="reason-label">Rejection Reason:</span>
                          <span class="reason-text">{notification.rejectionReason}</span>
                        </div>
                      </div>
                    {/if}
                  {/if}
                </div>
                
                <!-- Notification Actions -->
                <div class="notification-actions">
                  <button 
                    class="action-btn-small read-toggle"
                    on:click={() => toggleNotificationRead(notification.id)}
                    title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
                  >
                    <span class="material-symbols-outlined">
                      {notification.isRead ? 'mark_email_unread' : 'mark_email_read'}
                    </span>
                  </button>
                  
                  <button 
                    class="action-btn-small delete-btn"
                    on:click={() => deleteNotification(notification.id)}
                    title="Delete notification"
                  >
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/key}
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