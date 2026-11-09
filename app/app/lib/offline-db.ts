const DB_NAME = "demandarecife_db";
const DB_VERSION = 1;
const QUEUE_STORE = "sync_queue";

export type QueuedAction = {
  id?: number;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH";
  payload: unknown;
  criadoEm: string;
};

// Abre ou cria o banco local IndexedDB
export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB não suportado neste ambiente."));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Salva uma requisição offline na fila
export async function queueOfflineAction(action: Omit<QueuedAction, "id" | "criadoEm">): Promise<number> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);

    const item: QueuedAction = {
      ...action,
      criadoEm: new Date().toISOString(),
    };

    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

// Retorna todas as ações acumuladas na fila
export async function getQueuedActions(): Promise<QueuedAction[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Remove uma ação após ser sincronizada
export async function removeQueuedAction(id: number): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Executa o envio em segundo plano quando a rede voltar
export async function processSyncQueue(): Promise<{ total: number; sincronizados: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { total: 0, sincronizados: 0 };
  }

  const actions = await getQueuedActions();
  if (actions.length === 0) return { total: 0, sincronizados: 0 };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("access_token");

  let sincronizados = 0;

  for (const action of actions) {
    try {
      const response = await fetch(`${API_URL}${action.endpoint}`, {
        method: action.method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(action.payload),
      });

      if (response.ok && action.id !== undefined) {
        await removeQueuedAction(action.id);
        sincronizados++;
      }
    } catch {
      // Falha de rede temporária: para a tentativa e tenta na próxima reconexão
      break;
    }
  }

  return { total: actions.length, sincronizados };
}