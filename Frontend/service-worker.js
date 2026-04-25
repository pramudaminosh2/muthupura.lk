const CACHE_NAME = 'muthupura-v2';
const OFFLINE_PAGE = '/offline.html';

// Static assets that should be cached (NOT including HTML pages)
const STATIC_ASSETS = [
  '/offline.html',
  '/styles.css',
  '/shared.css',
  '/styles/navbar.css',
  '/config.js',
  '/auth-ui.js',
  '/js/navbar.js',
  '/pwa-install.js',
  '/logo.PNG',
  '/hero-bg.png'
];

// Dynamic pages that should NOT be cached (always get fresh from network)
const DYNAMIC_PAGES = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/vehicle.html',
  '/login.html',
  '/admin.html'
];

// Auth endpoints that must NEVER be cached
const AUTH_ENDPOINTS = [
  '/api/auth',
  '/api/login',
  '/api/register',
  '/api/logout',
  '/api/profile',
  '/api/user',
  'firebaseapp.com/identitytoolkit',
  'securetoken.googleapis.com'
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Service Worker: Some assets failed to cache', err);
        // Don't fail the install if some assets can't be cached
        return cache.addAll(STATIC_ASSETS.filter(asset => asset !== '/hero-bg.png'));
      });
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

// Fetch event: smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  
  // 1. AUTH ENDPOINTS - NEVER CACHE
  const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => 
    request.url.includes(endpoint)
  );
  if (isAuthEndpoint) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline - Auth unavailable' }), 
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 2. CDN/EXTERNAL RESOURCES - Network only
  if (request.url.includes('googleapis.com') || 
      request.url.includes('gstatic.com') || 
      request.url.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response('CDN resource unavailable offline', { status: 503 });
      })
    );
    return;
  }

  // 3. DYNAMIC PAGES - Network first, fallback to cache
  if (DYNAMIC_PAGES.some(page => request.url.endsWith(page))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful HTML responses
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: try cache
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_PAGE);
          });
        })
    );
    return;
  }

  // 4. API CALLS - Network first
  if (request.url.includes('/api/') || request.url.includes('firebaseapp.com')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_PAGE);
          });
        })
    );
    return;
  }

  // 5. STATIC ASSETS - Cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return new Response('Resource unavailable offline', { status: 503 });
        });
    })
  );
});

// Message event: handle skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
