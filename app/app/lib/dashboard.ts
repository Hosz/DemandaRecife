import { withAuth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const BRIEFING_LIST_LIMIT = 10;

export type BriefingAlert = {
  id: string;
  productId: string | null;
  tipo: string;
  titulo: string;
  descricao: string;
  prioridade: string;
  status: string;
  criadoEm: string;
};

export type BriefingPurchase = {
  productId: string;
  produto: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  comprarAgora: boolean;
  quantidadeSugerida: number;
  metodo: string;
};

export type BriefingForecast = {
  productId: string;
  produto: string;
  quantidadePrevista: number;
};

export type DailyBriefingData = {
  data: string;
  alertas: BriefingAlert[];
  compras: BriefingPurchase[];
  previsaoVendas: BriefingForecast[];
  secoesComFalha: string[];
};

export type BriefingResult =
  | { ok: true; data: DailyBriefingData }
  | { ok: false; message: string };

export async function fetchDailyBriefing(): Promise<BriefingResult> {
  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/api/dashboard/daily-briefing`,
      withAuth({ cache: "no-store" }),
    );
  } catch {
    return { ok: false, message: "Não foi possível conectar ao servidor." };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      message: "Sua sessão não é válida. Entre novamente para ver o briefing.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: "O servidor não conseguiu montar o briefing agora.",
    };
  }

  try {
    const body = (await response.json()) as Partial<DailyBriefingData>;

    return {
      ok: true,
      data: {
        data: body.data ?? "",
        alertas: body.alertas ?? [],
        compras: body.compras ?? [],
        previsaoVendas: body.previsaoVendas ?? [],
        secoesComFalha: body.secoesComFalha ?? [],
      },
    };
  } catch {
    return { ok: false, message: "O servidor devolveu uma resposta inesperada." };
  }
}