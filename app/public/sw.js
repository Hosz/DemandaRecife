/* eslint-disable no-restricted-globals */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Item 1: Listener para eventos Push disparados pelo backend
self.addEventListener("push", (event) => {
  let data = {
    title: "Alerta Operacional - DemandaRecife",
    body: "Novo alerta de estoque ou demanda disponível.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url: "/previsoes",
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.titulo || payload.title || data.title,
        body: payload.descricao || payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        url: payload.url || data.url,
      };
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Ação ao clicar na notificação no celular/SO
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});