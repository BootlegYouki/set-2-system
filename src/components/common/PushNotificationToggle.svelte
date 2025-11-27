<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { 
    pushNotificationStore,
    isPushSupported,
    initPushNotifications,
    subscribeToPush,
    unsubscribeFromPush,
    checkSubscriptionStatus
  } from '../../lib/push/pushNotifications.js';
  import { authStore } from '../login/js/auth.js';
  import { toastStore } from './js/toastStore.js';

  // Store values
  let isSupported = $derived($pushNotificationStore.isSupported);
  let isSubscribed = $derived($pushNotificationStore.isSubscribed);
  let permission = $derived($pushNotificationStore.permission);
  
  // Local state
  let isLoading = $state(false);
  let isIOS = $state(false);
  let isStandalone = $state(false);

  // Initialize on mount
  onMount(async () => {
    if (browser) {
      // Check if iOS
      isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      // Check if running as standalone PWA
      isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
      
      await initPushNotifications();
    }
  });

  // Handle subscribe/unsubscribe toggle
  async function handleToggle() {
    if (!browser) return;
    
    const user = $authStore.userData;
    if (!user?.id) {
      toastStore.error('Please log in to enable notifications');
      return;
    }
    
    isLoading = true;
    
    try {
      if (isSubscribed) {
        await unsubscribeFromPush(user.id);
        toastStore.success('Push notifications disabled');
      } else {
        await subscribeToPush(user.id);
        toastStore.success('Push notifications enabled!');
      }
      await checkSubscriptionStatus();
    } catch (err) {
      console.error('Push notification toggle error:', err);
      if (err.message.includes('permission denied')) {
        toastStore.error('Notification permission denied. Please enable in browser settings.');
      } else {
        toastStore.error('Failed to update notification settings');
      }
      await checkSubscriptionStatus();
    } finally {
      isLoading = false;
    }
  }

  // Get status message
  function getStatusMessage() {
    if (!isSupported) {
      if (isIOS && !isStandalone) {
        return 'Add to Home Screen first';
      }
      return 'Not supported';
    }
    if (permission === 'denied') return 'Blocked';
    if (isSubscribed) return 'On';
    return 'Off';
  }
</script>

<div class="push-toggle-row">
  <div class="push-info">
    <span class="material-symbols-outlined push-icon" class:active={isSubscribed}>
      {isSubscribed ? 'notifications_active' : 'notifications_none'}
    </span>
    <div class="push-text">
      <span class="push-label">Push Notifications</span>
      <span class="push-status" class:active={isSubscribed} class:warning={!isSupported && isIOS && !isStandalone}>
        {getStatusMessage()}
      </span>
    </div>
  </div>
  
  {#if isSupported && permission !== 'denied'}
    <button 
      class="toggle-btn" 
      class:active={isSubscribed}
      onclick={handleToggle}
      disabled={isLoading}
    >
      {#if isLoading}
        <span class="spinner"></span>
      {:else}
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      {/if}
    </button>
  {/if}
</div>

<style>
  .push-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--md-sys-color-surface-container-low);
    border-radius: 12px;
  }

  .push-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .push-icon {
    font-size: 1.25rem;
    color: var(--md-sys-color-on-surface-variant);
  }

  .push-icon.active {
    color: var(--md-sys-color-primary);
  }

  .push-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .push-label {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
  }

  .push-status {
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
  }

  .push-status.active {
    color: var(--md-sys-color-primary);
  }

  .push-status.warning {
    color: var(--md-sys-color-error);
  }

  .toggle-btn {
    width: 48px;
    height: 28px;
    padding: 2px;
    border: none;
    border-radius: 14px;
    background: var(--md-sys-color-surface-container-highest);
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .toggle-btn:hover:not(:disabled) {
    background: var(--md-sys-color-on-surface-variant);
  }

  .toggle-btn.active {
    background: var(--md-sys-color-primary);
  }

  .toggle-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toggle-track {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    padding: 0 2px;
  }

  .toggle-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--md-sys-color-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;
  }

  .toggle-btn.active .toggle-thumb {
    transform: translateX(20px);
    background: var(--md-sys-color-on-primary);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--md-sys-color-on-surface-variant);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto;
    display: block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
