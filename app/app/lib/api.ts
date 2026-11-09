const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
import {
  withAuth,
  saveAuthSession,
  redirectToLogin,
  getAccessToken,
  getRefreshToken,
} from "./auth";

export type ApiResult = {
  ok: boolean;
  message: string;
};

export type SalePayload = {
  productId?: string;
  productName?: string;
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

export type LoginPayload = {
  email: string;
  senha: string;
};

export type LoginResponseData = {
  userId: string;
  tenantId: string | null;
  nome: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type RegisterPayload = {
  nome: string;
  email: string;
  senha: string;
};

export type OnboardingData = {
  userName: string;
  businessName?: string;
  niche: string;
  businessDays: string[];
  openingTime: string;
  closingTime: string;
  averageTicket?: number | null;
  cidade?: string;
  estado?: string;
  bairro?: string;
  cnpj?: string;
  usarBenchmarksColdStart?: boolean;
};

export type TenantResponseData = {
  tenantId: string;
  nome: string;
  nichoAtuacao?: string;
  ticketMedio?: number | null;
  cidade?: string;
  estado?: string;
  bairro?: string;
  cnpj?: string;
  perfil?: {
    profileId?: string;
    responsavelNome?: string;
    horarioAbertura?: string;
    horarioFechamento?: string;
    diasFuncionamento?: string[];
    usarBenchmarksColdStart?: boolean;
  };
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
      if (typeof value === "string" && value.trim()) return value;
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
    const response = await fetch(`${API_URL}${path}`, withAuth(init));

    if (response.ok) {
      return await onSuccess(response);
    }

    if (response.status === 401 || response.status === 403) {
      if (response.status === 401) {
        redirectToLogin();
      }
      return {
        ok: false,
        message: "A API recusou o acesso. Verifique o login e tente novamente.",
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
  const unitPrice = Math.round((sale.totalValue / sale.quantity) * 100) / 100;

  return request(
    "/api/sales",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: sale.productId || undefined,
        productName: sale.productName?.trim() || undefined,
        quantidade: sale.quantity,
        precoUnitario: unitPrice,
        dataHoraVenda: toLocalDateTime(sale.soldAt),
        canal: sale.channel,
      }),
    },
    async () => ({ ok: true, message: "Venda registrada com sucesso." }),
    "Não foi possível registrar a venda. Confira os dados e tente novamente.",
  );
}

export function uploadSalesFile(file: File): Promise<ApiResult> {
  const formData = new FormData();
  formData.append("file", file);

  return request(
    "/api/sales/upload",
    { method: "POST", body: formData },
    describeImport,
    "Não foi possível enviar o arquivo. Tente novamente.",
  );
}

export async function loginUser(payload: LoginPayload): Promise<ApiResult & { session?: LoginResponseData }> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      saveAuthSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        tenantId: data.tenantId,
        nome: data.nome,
        email: data.email,
      });
      return { ok: true, message: "Login realizado com sucesso!", session: data };
    }

    const message = await readErrorMessage(response);
    return {
      ok: false,
      message: message ?? "Credenciais inválidas. Verifique seu e-mail e senha.",
    };
  } catch {
    return {
      ok: false,
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export async function registerUser(payload: RegisterPayload): Promise<ApiResult & { userId?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return { ok: true, message: "Cadastro realizado com sucesso!", userId: data.userId };
    }

    const message = await readErrorMessage(response);
    return {
      ok: false,
      message: message ?? "Não foi possível realizar o cadastro. Tente novamente.",
    };
  } catch {
    return {
      ok: false,
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export async function submitOnboarding(data: OnboardingData): Promise<ApiResult & { tenantId?: string }> {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/onboard`,
      withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          cidade: data.cidade || "Recife",
          estado: data.estado || "PE",
        }),
      }),
    );

    if (response.ok) {
      const responseData = await response.json();
      if (responseData.accessToken) {
        saveAuthSession({
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken,
          tenantId: responseData.tenantId,
        });
      } else if (responseData.tenantId) {
        saveAuthSession({
          accessToken: getAccessToken() ?? "",
          refreshToken: getRefreshToken() ?? "",
          tenantId: responseData.tenantId,
        });
      }
      return { ok: true, message: "Onboarding concluído com sucesso!", tenantId: responseData.tenantId };
    }

    if (response.status === 401) {
      redirectToLogin();
    }

    const apiMessage = await readErrorMessage(response);
    return {
      ok: false,
      message: apiMessage ?? "Não foi possível salvar as configurações iniciais. Tente novamente.",
    };
  } catch {
    return {
      ok: false,
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export async function getTenantSettings(tenantId: string): Promise<TenantResponseData | null> {
  try {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}`, withAuth({ cache: "no-store" }));
    if (!response.ok) return null;
    return (await response.json()) as TenantResponseData;
  } catch {
    return null;
  }
}

export async function updateTenantSettings(
  tenantId: string,
  data: Partial<OnboardingData>,
): Promise<ApiResult & { tenant?: TenantResponseData }> {
  try {
    const response = await fetch(
      `${API_URL}/api/tenants/${tenantId}`,
      withAuth({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );

    if (response.ok) {
      const responseData = (await response.json()) as TenantResponseData;
      return { ok: true, message: "Configurações atualizadas com sucesso!", tenant: responseData };
    }

    if (response.status === 401) {
      redirectToLogin();
    }

    const apiMessage = await readErrorMessage(response);
    return {
      ok: false,
      message: apiMessage ?? "Não foi possível atualizar as configurações. Tente novamente.",
    };
  } catch {
    return {
      ok: false,
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export type WeatherData = {
  temp: string;
  condition: string;
  location: string;
  date: string;
  precipitacaoMm?: number;
};

export type HolidayData = {
  nome: string;
  data: string;
  tipo: string;
  localidade: string;
  proximo: boolean;
};

export type IntegrationsStatus = {
  vendasDisponivel: boolean;
  climaDisponivel: boolean;
  eventosDisponivel: boolean;
  horarioPicoDisponivel: boolean;
  climaAtual?: WeatherData;
  proximosEventos?: HolidayData[];
  horarioPico?: string;
  faixaPico?: string;
};

export async function fetchWeather(cidade = "Recife", estado = "PE"): Promise<WeatherData> {
  try {
    const res = await fetch(`${API_URL}/api/external/weather?cidade=${encodeURIComponent(cidade)}&estado=${encodeURIComponent(estado)}`);
    if (res.ok) return (await res.json()) as WeatherData;
  } catch {
    // fallback
  }
  return {
    temp: "28°C",
    condition: "Ensolarado",
    location: `${cidade}, ${estado}`,
    date: "Hoje",
  };
}

export async function fetchHolidays(cidade = "Recife", estado = "PE"): Promise<HolidayData[]> {
  try {
    const res = await fetch(`${API_URL}/api/external/holidays?cidade=${encodeURIComponent(cidade)}&estado=${encodeURIComponent(estado)}`);
    if (res.ok) return (await res.json()) as HolidayData[];
  } catch {
    // fallback
  }
  return [];
}

export async function fetchIntegrationsStatus(): Promise<IntegrationsStatus> {
  try {
    const res = await fetch(`${API_URL}/api/external/status`);
    if (res.ok) {
      return (await res.json()) as IntegrationsStatus;
    }
  } catch {
    // fallback
  }
  return {
    vendasDisponivel: true,
    climaDisponivel: true,
    eventosDisponivel: true,
    horarioPicoDisponivel: true,
    climaAtual: {
      temp: "28°C",
      condition: "Ensolarado",
      location: "Recife, PE",
      date: "Hoje",
    },
    proximosEventos: [
      {
        nome: "Data Magna de Pernambuco",
        data: "06/03/2025",
        tipo: "Feriado Estadual",
        localidade: "PE",
        proximo: false,
      },
      {
        nome: "São João",
        data: "24/06/2025",
        tipo: "Feriado Estadual",
        localidade: "PE",
        proximo: false,
      },
    ],
    horarioPico: "18:00",
    faixaPico: "entre 17h e 19h",
  };
}

export type ProductItem = {
  id: string;
  nome: string;
  sku?: string;
  precoVenda?: number;
  custoUnidade?: number;
};

export type BenchmarkSuggestion = {
  id: string;
  nomeSugerido: string;
  categoria?: string;
  precoSugerido: number;
  mediaDiaria: number;
  unidade?: string;
};

export async function fetchProducts(): Promise<ProductItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/products`, withAuth({ cache: "no-store" }));
    if (res.ok) {
      return (await res.json()) as ProductItem[];
    }
  } catch {
    // fallback
  }
  return [];
}

export async function fetchBenchmarkSuggestions(nicho?: string): Promise<BenchmarkSuggestion[]> {
  try {
    const query = nicho ? `?nicho=${encodeURIComponent(nicho)}` : "";
    const res = await fetch(`${API_URL}/api/products/benchmarks/suggestions${query}`, withAuth({ cache: "no-store" }));
    if (res.ok) {
      return (await res.json()) as BenchmarkSuggestion[];
    }
  } catch {
    // fallback
  }
  return [];
}

export async function addStarterKit(ids?: string[], nicho?: string): Promise<ProductItem[]> {
  try {
    const query = nicho ? `?nicho=${encodeURIComponent(nicho)}` : "";
    const res = await fetch(
      `${API_URL}/api/products/starter-kit${query}`,
      withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: ids ? JSON.stringify(ids) : undefined,
      }),
    );
    if (res.ok) {
      return (await res.json()) as ProductItem[];
    }
  } catch {
    // fallback
  }
  return [];
}

export type ReplenishmentSuggestionDto = {
  productId: string;
  produto: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  comprarAgora: boolean;
  quantidadeSugerida: number;
  metodo: "PREVISAO" | "PADRAO";
};

export async function fetchReplenishmentSuggestions(
  apenasComprar = false,
): Promise<ReplenishmentSuggestionDto[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/replenishment?apenasComprar=${apenasComprar}`,
      withAuth({ cache: "no-store" }),
    );
    if (res.ok) {
      return (await res.json()) as ReplenishmentSuggestionDto[];
    }
  } catch {
    // fallback
  }
  return [];
}

export type BackendPromotionSimulation = {
  productId: string;
  produto: string;
  custo: number;
  precoAtual: number;
  margemAtualPercentual: number;
  descontoMaximoPercentual: number;
  precoMinimo: number;
  descontoAplicadoPercentual?: number;
  novoPreco?: number;
  novaMargemPercentual?: number;
  lucroUnitario?: number;
  status?: "APROVADO" | "RISCO_FINANCEIRO";
};

export async function simulatePromotionApi(
  productId: string,
  discountPercentage?: number,
  targetPrice?: number,
): Promise<BackendPromotionSimulation | null> {
  try {
    let url = `${API_URL}/api/promotions/simulation?productId=${productId}`;
    if (discountPercentage !== undefined) {
      url += `&discountPercentage=${discountPercentage}`;
    }
    if (targetPrice !== undefined) {
      url += `&targetPrice=${targetPrice}`;
    }
    const res = await fetch(url, withAuth({ cache: "no-store" }));
    if (res.ok) {
      return (await res.json()) as BackendPromotionSimulation;
    }
  } catch {
    // fallback
  }
  return null;
}

export type OperationalAlertDto = {
  id: string;
  productId?: string;
  tipo: string;
  titulo: string;
  descricao: string;
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA" | string;
  status: "ATIVO" | "RESOLVIDO" | "EXPIRADO" | string;
  criadoEm?: string;
  lidoEm?: string;
  resolvidoEm?: string;
};

export async function fetchAlerts(status = "ATIVO"): Promise<OperationalAlertDto[]> {
  try {
    const res = await fetch(`${API_URL}/api/alerts?status=${status}`, withAuth({ cache: "no-store" }));
    if (res.ok) {
      return (await res.json()) as OperationalAlertDto[];
    }
  } catch {
    // fallback
  }
  return [];
}

export async function markAlertAsRead(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/alerts/${id}/read`, withAuth({ method: "PATCH" }));
    return res.ok;
  } catch {
    return false;
  }
}

export async function resolveAlert(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/alerts/${id}/resolve`, withAuth({ method: "PATCH" }));
    return res.ok;
  } catch {
    return false;
  }
}

export type TeamMemberItem = {
  id: string;
  nome: string;
  cargo?: string;
};

export type ShiftItem = {
  id?: string;
  diaSemana: string;
  horario: string;
  horarioInicio?: string;
  horarioFim?: string;
  demanda: string;
  tipoDemanda: "baixa" | "media" | "alta";
  vagaPendente?: boolean;
  funcao?: string;
  intervalo?: string;
  observacoes?: string;
  funcionarios: string[];
};

export async function fetchTeamMembers(): Promise<TeamMemberItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/team/members`, withAuth({ cache: "no-store" }));
    if (res.ok) {
      return (await res.json()) as TeamMemberItem[];
    }
  } catch {
    // fallback
  }
  return [];
}

export async function createTeamMember(nome: string, cargo?: string): Promise<TeamMemberItem | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/team/members`,
      withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cargo }),
      }),
    );
    if (res.ok) {
      return (await res.json()) as TeamMemberItem;
    }
  } catch {
    // fallback
  }
  return null;
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/team/members/${id}`, withAuth({ method: "DELETE" }));
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchShifts(diaSemana: string): Promise<ShiftItem[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/team/shifts?diaSemana=${encodeURIComponent(diaSemana)}`,
      withAuth({ cache: "no-store" }),
    );
    if (res.ok) {
      return (await res.json()) as ShiftItem[];
    }
  } catch {
    // fallback
  }
  return [];
}

export async function saveShift(shift: ShiftItem): Promise<ShiftItem | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/team/shifts`,
      withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: shift.id,
          diaSemana: shift.diaSemana,
          horarioInicio: shift.horarioInicio || shift.horario.split("–")[0],
          horarioFim: shift.horarioFim || shift.horario.split("–")[1],
          demanda: shift.demanda,
          tipoDemanda: shift.tipoDemanda,
          vagaPendente: shift.vagaPendente ?? false,
          funcao: shift.funcao || "Geral",
          intervalo: shift.intervalo,
          observacoes: shift.observacoes,
          funcionarios: shift.funcionarios,
        }),
      }),
    );
    if (res.ok) {
      return (await res.json()) as ShiftItem;
    }
  } catch {
    // fallback
  }
  return null;
}

export async function deleteShift(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/team/shifts/${id}`, withAuth({ method: "DELETE" }));
    return res.ok;
  } catch {
    return false;
  }
}

export type CampaignItem = {
  id: string;
  productId?: string;
  titulo: string;
  detalhe?: string;
  descontoPercentual?: number;
  precoPromocional?: number;
  status: "Ativa" | "Agendada" | "Pausada" | "Encerrada" | string;
  data: string;
  dataFim?: string;
  eventoVinculado?: string;
};

export type CreateCampaignRequest = {
  productId?: string;
  titulo: string;
  detalhe?: string;
  descontoPercentual: number;
  precoPromocional: number;
  status?: string;
  data?: string;
  dataFim?: string;
  eventoVinculado?: string;
};

export async function fetchCampaigns(): Promise<CampaignItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/promotions/campaigns`, withAuth({ cache: "no-store" }));
    if (res.ok) {
      return (await res.json()) as CampaignItem[];
    }
  } catch {
    // fallback
  }
  return [];
}

export async function createCampaign(req: CreateCampaignRequest): Promise<CampaignItem | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/promotions/campaigns`,
      withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      }),
    );
    if (res.ok) {
      return (await res.json()) as CampaignItem;
    }
  } catch {
    // fallback
  }
  return null;
}

export async function updateCampaign(id: string, req: CreateCampaignRequest): Promise<CampaignItem | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/promotions/campaigns/${id}`,
      withAuth({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      }),
    );
    if (res.ok) {
      return (await res.json()) as CampaignItem;
    }
  } catch {
    // fallback
  }
  return null;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/promotions/campaigns/${id}`, withAuth({ method: "DELETE" }));
    return res.ok;
  } catch {
    return false;
  }
}

