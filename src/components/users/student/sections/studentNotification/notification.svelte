<script>
  import './notification.css';

  // Notification data - in real app this would come from props or API
  let notifications = [
    {
      id: 1,
      type: 'todo',
      title: 'Physics Lab Report Due Tomorrow',
      message: 'Complete the lab report on gravity experiments - due tomorrow',
      timestamp: '2024-01-15T14:00:00Z',
      isRead: false,
      priority: 'high'
    },
    {
      id: 2,
      title: 'Grade Posted',
      message: 'Your grade for Mathematics Quiz #3 has been posted. Check your grades section for details.',
      type: 'grade',
      timestamp: '2024-01-15T09:15:00Z',
      isRead: false,
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Document Ready',
      message: 'Your requested transcript is ready for pickup at the admin office.',
      type: 'document',
      timestamp: '2024-01-14T16:45:00Z',
      isRead: true,
      priority: 'high'
    },
    {
      id: 4,
      type: 'todo',
      title: 'Math Quiz Today',
      message: 'Study for Math Quiz - Review chapters 5-7 for today\'s quiz',
      timestamp: '2024-01-15T11:00:00Z',
      isRead: false,
      priority: 'high'
    },
    {
      id: 5,
      title: 'Final Grade Available',
      message: 'Your final grade for English Literature has been posted. Check your academic record.',
      type: 'grade',
      timestamp: '2024-01-13T11:00:00Z',
      isRead: true,
      priority: 'medium'
    },
    {
      id: 6,
      title: 'Enrollment Verification Ready',
      message: 'Your enrollment verification document is ready for download from the student portal.',
      type: 'document',
      timestamp: '2024-01-12T13:30:00Z',
      isRead: false,
      priority: 'medium'
    },
    {
      id: 7,
      type: 'todo',
      title: 'Assignment Deadline Approaching',
      message: 'College Application submission due next week - don\'t forget to complete',
      timestamp: '2024-01-14T10:00:00Z',
      isRead: false,
      priority: 'medium'
    }
  ];

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

  // Functions
  function toggleFilterDropdown() {
    isFilterDropdownOpen = !isFilterDropdownOpen;
  }

  function selectFilter(filter) {
    selectedFilter = filter;
    isFilterDropdownOpen = false;
  }

  function handleClickOutside(event) {
    if (!event.target.closest('.filter-dropdown')) {
      isFilterDropdownOpen = false;
    }
  }

  function toggleNotificationRead(id) {
    notifications = notifications.map(notification => 
      notification.id === id 
        ? { ...notification, isRead: !notification.isRead }
        : notification
    );
  }

  function deleteNotification(id) {
    notifications = notifications.filter(notification => notification.id !== id);
  }

  function markAllAsRead() {
    notifications = notifications.map(notification => ({ ...notification, isRead: true }));
  }

  function clearAllRead() {
    notifications = notifications.filter(notification => !notification.isRead);
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

  $: unreadCount = notifications.filter(n => !n.isRead).length;
  $: totalCount = notifications.length;
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
    {#if filteredNotifications.length > 0}
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