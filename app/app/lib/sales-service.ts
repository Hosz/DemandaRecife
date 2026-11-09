import { queueOfflineAction } from "./offline-db";

export type SalePayload = {
  productId: string;
  quantidade: number;
  valorUnitario: number;
  dataHora?: string;
};

export async function registrarVenda(payload: SalePayload): Promise<{ offline: boolean; data?: unknown }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("access_token");

  // Se o dispositivo estiver offline, salva direto na fila do IndexedDB
  if (typeof window !== "undefined" && !navigator.onLine) {
    await queueOfflineAction({
      endpoint: "/api/sales",
      method: "POST",
      payload,
    });
    return { offline: true };
  }

  try {
    const res = await fetch(`${API_URL}/api/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Erro na API: ${res.status}`);
    }

    const data = await res.json();
    return { offline: false, data };
  } catch {
    // Se a requisição cair por instabilidade de rede, joga para a fila
    await queueOfflineAction({
      endpoint: "/api/sales",
      method: "POST",
      payload,
    });
    return { offline: true };
  }
}