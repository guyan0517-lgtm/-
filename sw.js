// Service Worker v23.6 - Push Notifications only (no navigation/fetch interception)
const CACHE_NAME = "ephone-tuk-cache-v23.6";

if (typeof window === "undefined" && typeof self !== "undefined" && typeof self.skipWaiting === "function") {
  self.addEventListener("install", event => {
    self.skipWaiting();
  });

  self.addEventListener("activate", event => {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => caches.delete(cache))
        );
      }).then(() => self.clients.claim())
    );
  });

  self.addEventListener("notificationclick", event => {
    const notifData = (event.notification && event.notification.data) || {};
    event.notification.close();

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then(clientList => {
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client && typeof client.postMessage === "function") {
              client.postMessage({
                type: "PEER_NOTIFICATION_CLICK",
                chatId: notifData.chatId || "",
                openRequests: !!notifData.openRequests
              });
            }
            if ("focus" in client) {
              return client.focus();
            }
          }

          if (self.clients.openWindow) {
            return self.clients.openWindow("/");
          }
        })
    );
  });

  self.addEventListener("message", event => {
    const data = event.data;
    if (!data || (data.type !== "SHOW_PEER_NOTIFICATION" && data.type !== "SHOW_AI_NOTIFICATION")) return;
    const title = data.title || "新消息";
    const tag = data.tag || ("peer_notif_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6));
    const notifData = {
      chatId: data.chatId || "",
      openRequests: !!notifData.openRequests
    };
    const options = {
      body: data.body || "",
      icon: data.icon || "./icon-192.png",
      badge: "./icon-192.png",
      tag: tag,
      renotify: true,
      silent: false,
      vibrate: [200, 100, 200],
      data: notifData
    };
    event.waitUntil(
      self.registration.showNotification(title, options).catch(() => {
        return self.registration.showNotification(title, {
          body: data.body || "",
          icon: data.icon || "./icon-192.png",
          tag: tag,
          data: notifData
        }).catch(() => {});
      })
    );
  });

  self.addEventListener("push", event => {
    if (!event.data) return;

    let data = {};
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "新消息", body: event.data.text() };
    }

    const title = data.title || "四半世紀";
    const options = {
      body: data.body,
      icon: "icon.png",
      badge: "icon.png",
      renotify: true,
      silent: false,
      vibrate: [200, 100, 200],
      data: data.data || {}
    };

    event.waitUntil(self.registration.showNotification(title, options));
  });
}
