// Service Worker for FSAS PWA
const CACHE_NAME = 'fsas-v1.0.0';
const STATIC_CACHE = 'fsas-static-v1.0.0';
const DYNAMIC_CACHE = 'fsas-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // Handle page requests
    event.respondWith(handlePageRequest(request));
  } else if (request.destination === 'image') {
    // Handle image requests
    event.respondWith(handleImageRequest(request));
  } else if (request.destination === 'script' || request.destination === 'style') {
    // Handle asset requests
    event.respondWith(handleAssetRequest(request));
  } else {
    // Handle API requests
    event.respondWith(handleApiRequest(request));
  }
});

// Handle page requests
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network request failed, trying cache');
  }

  // Try cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html');
  }

  // Return a basic response for other requests
  return new Response('Offline', { status: 503 });
}

// Handle image requests
async function handleImageRequest(request) {
  try {
    // Try cache first for images
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Image request failed');
  }

  // Return a placeholder image
  return new Response('', { status: 404 });
}

// Handle asset requests (JS, CSS)
async function handleAssetRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Asset request failed');
  }

  return new Response('Asset not found', { status: 404 });
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for a short time
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: API request failed, trying cache');
  }

  // Try cache for API requests
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline response for API requests
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Offline - Please check your connection' 
    }),
    { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Background sync for attendance data
self.addEventListener('sync', (event) => {
  if (event.tag === 'attendance-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(syncAttendanceData());
  }
});

// Sync attendance data when back online
async function syncAttendanceData() {
  try {
    // Get pending attendance records from IndexedDB
    const pendingRecords = await getPendingAttendanceRecords();
    
    for (const record of pendingRecords) {
      try {
        const response = await fetch('/api/sessions/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record)
        });

        if (response.ok) {
          // Remove from pending records
          await removePendingAttendanceRecord(record.id);
          console.log('Service Worker: Synced attendance record', record.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync record', record.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: data.data,
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingAttendanceRecords() {
  // In a real implementation, this would interact with IndexedDB
  return [];
}

async function removePendingAttendanceRecord(id) {
  // In a real implementation, this would remove the record from IndexedDB
  console.log('Service Worker: Removed pending record', id);
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'attendance-sync') {
    event.waitUntil(syncAttendanceData());
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Loaded successfully');
