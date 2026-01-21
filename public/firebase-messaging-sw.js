// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCnnbF_xvHjqYkpkf3poktjuDf-iOHPo4w",
  authDomain: "ugwatch-285f7.firebaseapp.com",
  databaseURL: "https://ugwatch-285f7-default-rtdb.firebaseio.com",
  projectId: "ugwatch-285f7",
  storageBucket: "ugwatch-285f7.firebasestorage.app",
  messagingSenderId: "1091918498632",
  appId: "1:1091918498632:web:1e24c62a186e41310e817d"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'UgaWatch';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    image: payload.notification?.image || payload.data?.poster,
    data: payload.data,
    vibrate: [200, 100, 200],
    tag: payload.data?.movieId || 'ugawatch-notification',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  // Determine URL to open - priority: link > movieId > home
  let urlToOpen = '/';
  
  const data = event.notification.data || {};
  if (data.link) {
    // Handle both relative and absolute URLs
    if (data.link.startsWith('http')) {
      urlToOpen = data.link;
    } else {
      urlToOpen = data.link;
    }
  } else if (data.movieId) {
    urlToOpen = `/movie/${data.movieId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already an open window
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (!urlToOpen.startsWith('http')) {
            client.navigate(urlToOpen);
          } else {
            // For external links, open in new tab
            clients.openWindow(urlToOpen);
          }
          return;
        }
      }
      // No window open, open new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
