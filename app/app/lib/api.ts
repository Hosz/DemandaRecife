
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ApiResult = {
  ok: boolean;
  message: string;
};

export type SalePayload = {
  productId: string;
  quantity: number;
  totalValue: number;
  soldAt: string;
  channel: string;
};

type ImportResponse = {
  totalLinhas?: number;
  importadas?: number;
  erros?: { linha: number; motivo: string }[];
};

export interface OnboardingData {
  mode?: "register" | "login";
  userName: string;
  email: string;
  password: string;
  niche: string;
  businessDays: string[];
  openingTime: string;
  closingTime: string;
  averageTicket: number;
}

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  nome: string;
  email: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateTime(isoString: string) {
  const date = new Date(isoString);
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${day}T${time}`;
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body = await response.json();

    for (const key of ["erro", "message", "detail"]) {
      const value = body?.[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function request(
  path: string,
  init: RequestInit,
  onSuccess: (response: Response) => Promise<ApiResult>,
  fallbackError: string,
): Promise<ApiResult> {
  try {
    const headers = new Headers(init.headers);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
    });

    if (response.ok) {
      return await onSuccess(response);
    }

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        message: "A API recusou o acesso. Faça login novamente.",
      };
    }

    if (response.status === 413) {
      return {
        ok: false,
        message: "O arquivo é maior do que o servidor aceita.",
      };
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

async function describeImport(response: Response): Promise<ApiResult> {
  let result: ImportResponse;

  try {
    result = await response.json();
  } catch {
    return { ok: true, message: "Arquivo enviado com sucesso." };
  }

  const { totalLinhas, importadas, erros = [] } = result;

  if (typeof importadas !== "number" || typeof totalLinhas !== "number") {
    return { ok: true, message: "Arquivo enviado com sucesso." };
  }

  const firstError = erros[0];

  if (importadas === 0) {
    return {
      ok: false,
      message: firstError
        ? `Nenhuma linha importada. Linha ${firstError.linha}: ${firstError.motivo}`
        : "Nenhuma linha foi importada.",
    };
  }

  if (erros.length === 0) {
    return {
      ok: true,
      message: `${importadas} de ${totalLinhas} linhas importadas com sucesso.`,
    };
  }

  return {
    ok: true,
    message: `${importadas} de ${totalLinhas} linhas importadas. ${erros.length} com erro (linha ${firstError.linha}: ${firstError.motivo}).`,
  };
}

export function createSale(sale: SalePayload): Promise<ApiResult> {
  const unitPrice =
    Math.round((sale.totalValue / sale.quantity) * 100) / 100;

  return request(
    "/api/sales",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: sale.productId,
        quantidade: sale.quantity,
        precoUnitario: unitPrice,
        dataHoraVenda: toLocalDateTime(sale.soldAt),
        canal: sale.channel,
      }),
    },
    async () => ({
      ok: true,
      message: "Venda registrada com sucesso.",
    }),
    "Não foi possível registrar a venda. Confira os dados e tente novamente.",
  );
}

export function uploadSalesFile(file: File): Promise<ApiResult> {
  const formData = new FormData();
  formData.append("file", file);

  return request(
    "/api/sales/upload",
    {
      method: "POST",
      body: formData,
    },
    describeImport,
    "Não foi possível enviar o arquivo. Tente novamente.",
  );
}

export async function submitOnboarding(
  data: OnboardingData,
): Promise<ApiResult> {
  try {
    // Modo de login: autentica diretamente, sem tentar cadastrar.
    if (data.mode === "login") {
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          senha: data.password,
        }),
      });

      if (!loginResponse.ok) {
        const message = await readErrorMessage(loginResponse);

        return {
          ok: false,
          message: message ?? "E-mail ou senha incorretos.",
        };
      }

      const auth: LoginResponse = await loginResponse.json();

      if (!auth.accessToken) {
        return {
          ok: false,
          message: "O servidor não retornou o token de acesso.",
        };
      }

      localStorage.setItem("access_token", auth.accessToken);

      if (auth.refreshToken) {
        localStorage.setItem("refresh_token", auth.refreshToken);
      } else {
        localStorage.removeItem("refresh_token");
      }

      localStorage.setItem("user_name", auth.nome || "");
      localStorage.setItem("user_email", auth.email || data.email);

      return {
        ok: true,
        message: "Login realizado com sucesso!",
      };
    }

    // Modo de cadastro: cria a conta.
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: data.userName,
        email: data.email,
        senha: data.password,
      }),
    });

    if (!registerResponse.ok) {
      const message = await readErrorMessage(registerResponse);

      return {
        ok: false,
        message:
          message ??
          "Não foi possível cadastrar. Verifique os dados ou se o e-mail já está cadastrado.",
      };
    }

    // Faz login automaticamente após o cadastro.
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        senha: data.password,
      }),
    });

    if (!loginResponse.ok) {
      const message = await readErrorMessage(loginResponse);

      return {
        ok: false,
        message:
          message ??
          "Cadastro realizado, mas não foi possível fazer login.",
      };
    }

    const auth: LoginResponse = await loginResponse.json();

    if (!auth.accessToken) {
      return {
        ok: false,
        message: "O servidor não retornou o token de acesso.",
      };
    }

    localStorage.setItem("access_token", auth.accessToken);

    if (auth.refreshToken) {
      localStorage.setItem("refresh_token", auth.refreshToken);
    }

    localStorage.setItem("user_name", auth.nome || data.userName);
    localStorage.setItem("user_email", auth.email || data.email);

    return {
      ok: true,
      message: "Cadastro e login realizados com sucesso!",
    };
  } catch (error) {
    console.error("Erro na autenticação:", error);

    return {
      ok: false,
      message:
        "Não foi possível conectar ao servidor. Verifique se o backend está ligado.",
    };
  }
}
