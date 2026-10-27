const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type ApiResult = {
  ok: boolean;
  message: string;
};

export type SalePayload = {
  productId: string;
  quantity: number;
  soldAt: string;
};

// tenta ler uma mensagem de erro enviada pelo servidor ({ message } ou { error })
async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") return body.message;
    if (typeof body?.error === "string") return body.error;
    return null;
  } catch {
    return null;
  }
}

async function request(
  path: string,
  init: RequestInit,
  successMessage: string,
  fallbackError: string,
): Promise<ApiResult> {
  try {
    const response = await fetch(`${API_URL}${path}`, init);

    if (response.ok) {
      return { ok: true, message: successMessage };
    }

    if (response.status === 413) {
      return { ok: false, message: "O arquivo é maior do que o servidor aceita." };
    }

    const apiMessage = await readErrorMessage(response);
    return { ok: false, message: apiMessage ?? fallbackError };
  } catch {
    return {
      ok: false,
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export function createSale(sale: SalePayload): Promise<ApiResult> {
  return request(
    "/api/sales",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sale),
    },
    "Venda registrada com sucesso.",
    "Não foi possível registrar a venda. Tente novamente.",
  );
}

export function uploadSalesFile(file: File): Promise<ApiResult> {
  const formData = new FormData();
  formData.append("file", file); // nome do campo que o back precisa esperar

  // não define Content-Type aqui: o navegador coloca o correto com o boundary
  return request(
    "/api/sales/upload",
    { method: "POST", body: formData },
    "Arquivo enviado com sucesso.",
    "Não foi possível enviar o arquivo. Tente novamente.",
  );
}