function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch (err) {
    console.error("Falha ao registrar Service Worker:", err);
    return null;
  }
}

export async function requestAndSubscribePush(): Promise<PushSubscription | boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("Notificações não suportadas neste navegador.");
  }

  // 1. Solicita a permissão do usuário
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão para notificações não foi concedida.");
  }

  // 2. Garante o registro do Service Worker
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg = await registerServiceWorker() || undefined;
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  // 3. Se houver chave VAPID e PushManager suportado, faz a subscrição formal
  if (vapidPublicKey && "PushManager" in window && reg) {
    try {
      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      };

      const subscription = await reg.pushManager.subscribe(subscribeOptions);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem("access_token");

      try {
        await fetch(`${API_URL}/api/alerts/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(subscription),
        });
      } catch (err) {
        console.warn("Aviso: Falha ao enviar subscription para o backend:", err);
      }

      return subscription;
    } catch (pushErr) {
      console.warn("Subscrição push falhou, utilizando notificações locais:", pushErr);
    }
  }

  // 4. Modo Local / Simulação: dispara notificação de confirmação pelo Service Worker
  if (reg) {
    await reg.showNotification("DemandaRecife", {
      body: "Notificações operacionais ativadas com sucesso!",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
    });
  } else {
    new Notification("DemandaRecife", {
      body: "Notificações operacionais ativadas com sucesso!",
    });
  }

  return true;
}