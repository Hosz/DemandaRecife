"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { registerServiceWorker } from "../lib/push";
import { processSyncQueue } from "../lib/offline-db";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getOnlineServerSnapshot);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    // Registra Service Worker
    void registerServiceWorker();

    // Sincroniza se já estiver online
    if (navigator.onLine) {
      void processSyncQueue();
    }

    const handleOnline = async () => {
      setSyncStatus("Conexão restabelecida. Sincronizando dados...");
      const result = await processSyncQueue();
      if (result.sincronizados > 0) {
        setSyncStatus(`${result.sincronizados} registro(s) sincronizado(s) com sucesso.`);
        setTimeout(() => setSyncStatus(null), 4000);
      } else {
        setSyncStatus(null);
      }
    };

    const handleOffline = () => {
      setSyncStatus("Modo offline ativo. Os dados serão salvos localmente.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {/* Banner de status de sincronização no topo (mobile & desktop) */}
      {(!isOnline || syncStatus) && (
        <aside
          aria-label="Status de sincronização"
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-xs font-bold transition-all ${
            !isOnline
              ? "bg-amber-500/90 text-black backdrop-blur-sm"
              : "bg-[#d6ff00]/90 text-black backdrop-blur-sm"
          }`}
        >
          {!isOnline ? "⚠️ Você está offline. As ações serão guardadas e enviadas ao reconectar." : syncStatus}
        </aside>
      )}
      {children}
    </>
  );
}