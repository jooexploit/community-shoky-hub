// Service Worker for Push Notifications
self.addEventListener("push", function (event) {
  const options = {
    body: "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/favicon.ico",
      },
      {
        action: "close",
        title: "Close",
        icon: "/favicon.ico",
      },
    ],
    requireInteraction: false,
    silent: false,
  };

  let title = "Shoky Hub Notification";
  let body = "You have a new notification";
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || data.message || body;
      options.body = body;
      options.data = { ...options.data, ...data };

      // Add custom notification options based on type
      if (data.type) {
        switch (data.type) {
          case "error":
            options.requireInteraction = true;
            options.vibrate = [200, 100, 200, 100, 200];
            break;
          case "success":
            options.vibrate = [100, 50, 100];
            break;
          case "warning":
            options.requireInteraction = true;
            options.vibrate = [150, 50, 150];
            break;
        }
      }
    } catch (e) {
      // If JSON parsing fails, treat as plain text
      console.log("Push data is not JSON, treating as plain text:", e);
      try {
        const textData = event.data.text();
        if (textData) {
          body = textData;
          title = "New Notification";
          options.body = body;
        }
      } catch (textError) {
        console.log("Could not parse as text either:", textError);
        // Use defaults
      }
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // Get the notification data
  const data = event.notification.data || {};
  let targetUrl = "/";

  // Determine the target URL based on notification data
  if (data.url) {
    targetUrl = data.url;
  } else if (data.category) {
    switch (data.category) {
      case "task":
        targetUrl = "/tasks";
        break;
      case "content":
        targetUrl = "/content";
        break;
      case "event":
        targetUrl = "/calendar";
        break;
      case "announcement":
      case "general":
        targetUrl = "/notifications";
        break;
      default:
        targetUrl = "/";
    }
  }

  // Open the app or focus if already open
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          const clientUrl = new URL(client.url);

          if (clientUrl.origin === self.location.origin) {
            // App is open, navigate to target URL and focus
            client.navigate(targetUrl);
            return client.focus();
          }
        }

        // App is not open, open new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle background sync for offline notifications (future enhancement)
self.addEventListener("sync", function (event) {
  if (event.tag === "notification-sync") {
    event.waitUntil(
      // Future: sync offline notifications when back online
      Promise.resolve()
    );
  }
});

// Handle service worker installation
self.addEventListener("install", function (event) {
  console.log("Service Worker installing");
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener("activate", function (event) {
  console.log("Service Worker activating");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclose", function (event) {
  console.log("Notification was closed", event);
});
