/// <reference lib="webworker" />

// Service Worker for Push Notifications and PWA
const SW_VERSION = '1.0.3';
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
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Push event - iOS Safari requires minimal, synchronous handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  // Default data
  let title = 'SET-2 System';
  let options = {
    body: 'You have a new notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: '/' }
  };
  
  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('[SW] Push data:', pushData.title);
      title = pushData.title || title;
      options.body = pushData.body || options.body;
      options.icon = pushData.icon || options.icon;
      options.badge = pushData.badge || options.badge;
      options.data = pushData.data || options.data;
      // Only add tag if provided - helps with iOS
      if (pushData.tag) {
        options.tag = pushData.tag;
      }
    } catch (e) {
      console.error('[SW] Parse error:', e);
    }
  }
  
  // Show notification - must be synchronous within waitUntil
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if available
        for (const client of windowClients) {
          if ('focus' in client) {
            return client.focus().then((c) => {
              if ('navigate' in c) return c.navigate(urlToOpen);
            });
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Subscription changed');
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON(), resubscribe: true })
        });
      })
      .catch((err) => console.error('[SW] Re-subscribe failed:', err))
  );
});

console.log('[SW] Loaded, version:', SW_VERSION);
