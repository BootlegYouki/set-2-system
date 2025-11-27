/// <reference lib="webworker" />

// Service Worker for Push Notifications and PWA
const SW_VERSION = '1.0.1';
const CACHE_NAME = `set2-cache-${SW_VERSION}`;

// Assets to cache for offline support
const STATIC_ASSETS = [
  '/',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing, version:', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating, version:', SW_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('set2-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Install event - called when service worker is first installed
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing, version:', SW_VERSION);
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - called when service worker becomes active
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating, version:', SW_VERSION);
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
});

// Push event - called when a push notification is received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'SET-2 System',
    body: 'You have a new notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'set2-notification',
    data: {
      url: '/'
    }
  };
  
  // Try to parse the push data
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = {
        ...data,
        ...pushData
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      // Try as text if JSON parsing fails
      const text = event.data.text();
      if (text) {
        data.body = text;
      }
    }
  }
  
  console.log('[SW] Showing notification:', data.title);
  
  // Show the notification
  const promiseChain = self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: data.tag || 'set2-notification',
    requireInteraction: data.requireInteraction || false,
    renotify: data.renotify || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || { url: '/' },
    actions: data.actions || []
  });
  
  event.waitUntil(promiseChain);
});

// Notification click event - called when user clicks on a notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  // Close the notification
  event.notification.close();
  
  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/';
  
  // Handle action button clicks
  if (event.action) {
    console.log('[SW] Notification action clicked:', event.action);
    // You can handle different actions here
    switch (event.action) {
      case 'view':
        // Default action - open the URL
        break;
      case 'dismiss':
        // Just close the notification (already done above)
        return;
      default:
        break;
    }
  }
  
  // Focus existing window or open a new one
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there's already a window open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      // If we find an existing window, focus it and navigate
      if ('focus' in client) {
        return client.focus().then((focusedClient) => {
          if ('navigate' in focusedClient) {
            return focusedClient.navigate(urlToOpen);
          }
        });
      }
    }
    // If no existing window, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
});

// Notification close event - called when notification is dismissed
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  // You can track notification dismissals here if needed
});

// Message event - for communication with the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Send response back to client
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({
      type: 'SW_RESPONSE',
      message: 'Service worker received your message',
      version: SW_VERSION
    });
  }
});

// Push subscription change event
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');
  
  // Re-subscribe if the subscription was lost
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true
    }).then((subscription) => {
      console.log('[SW] Re-subscribed to push notifications');
      // Send the new subscription to your server
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          resubscribe: true
        })
      });
    }).catch((error) => {
      console.error('[SW] Failed to re-subscribe:', error);
    })
  );
});

console.log('[SW] Service Worker loaded, version:', SW_VERSION);
