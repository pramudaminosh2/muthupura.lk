/**
 * PWA Installation & Service Worker Management
 * Handles service worker registration, installation prompts, and updates
 * 
 * Cache version: v2
 * Last updated: April 24, 2026
 */

// Force cache refresh on app load
window.addEventListener('load', () => {
  // Clear old caches for iOS and browser
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (!name.includes('muthupura-v2')) {
          caches.delete(name).then(() => {
            console.log('✓ Cleared old cache:', name);
          });
        }
      });
    });
  }

  // Force manifest reload (fixes iOS icon cache)
  const manifest = document.querySelector('link[rel="manifest"]');
  if (manifest) {
    const newManifest = manifest.cloneNode(true);
    newManifest.href = '/manifest.json?v=' + Date.now();
    manifest.replaceWith(newManifest);
    console.log('✓ Manifest cache busted for iOS');
  }

  // Force apple-touch-icon reload
  const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (appleIcon) {
    appleIcon.href = '/icons/icon-192.png?v=' + Date.now();
    console.log('✓ Apple icon cache busted');
  }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✓ Service Worker registered successfully (v2):', registration);

        // Check for updates periodically (every 1 hour now for faster fixes)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('✓ Service Worker update found - reloading...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is ready - auto reload after 5 seconds
              console.log('✓ New Service Worker ready, reloading in 5 seconds...');
              setTimeout(() => {
                window.location.reload(true); // Hard reload
              }, 5000);
            }
          });
        });
      })
      .catch((error) => {
        console.warn('✗ Service Worker registration failed:', error);
      });

    // Handle messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_ACTIVATED') {
        console.log('✓ Service Worker activated - clearing old caches');
        // Clear old caches when new SW activates
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              if (name !== 'muthupura-v2') {
                caches.delete(name);
              }
            });
          });
        }
      }
    });
  });
} else {
  console.info('ℹ Service Worker not supported in this browser');
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent the mini-infobar from appearing on mobile
  event.preventDefault();
  // Store the event for later use
  deferredPrompt = event;
  console.log('✓ Install prompt available');
  
  // Show custom install button if you have one
  showInstallButton();
});

window.addEventListener('appinstalled', () => {
  console.log('✓ App successfully installed as PWA');
  deferredPrompt = null;
});

/**
 * Show install button if PWA can be installed
 */
function showInstallButton() {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton && deferredPrompt) {
    installButton.style.display = 'inline-block';
  }
}

/**
 * Trigger PWA installation
 */
window.installPWA = async function() {
  if (!deferredPrompt) {
    console.warn('Install prompt not available');
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
  deferredPrompt = null;
};

/**
 * Show update prompt when a new version is available
 */
function showUpdatePrompt(registration) {
  console.log('✓ App update available');
  
  // You can customize this - show a toast, banner, or modal
  const updateNotification = document.getElementById('pwa-update-notification');
  if (updateNotification) {
    updateNotification.style.display = 'flex';
    
    const updateButton = document.getElementById('pwa-update-button');
    if (updateButton) {
      updateButton.addEventListener('click', () => {
        registration.installing.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  } else {
    // Fallback: Simple console notification
    console.info('ℹ App update available. Reload to update.');
  }
}

/**
 * Check if running as standalone PWA
 */
window.isStandalonePWA = function() {
  return window.navigator.standalone === true || 
         window.matchMedia('(display-mode: standalone)').matches;
};

/**
 * Get PWA status
 */
window.getPWAStatus = function() {
  return {
    serviceWorkerSupported: 'serviceWorker' in navigator,
    canInstall: !!deferredPrompt,
    isStandalone: window.isStandalonePWA(),
    online: navigator.onLine
  };
};

// Log PWA status on startup
document.addEventListener('DOMContentLoaded', () => {
  const status = window.getPWAStatus();
  console.log('📱 PWA Status:', status);
});
