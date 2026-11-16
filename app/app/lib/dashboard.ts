const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
import { withAuth, redirectToLogin } from "./auth";

export type AiInsightItem = {
  id?: string;
  categoria?: string;
  title: string;
  text: string;
  diagnostico?: string;
  acaoSugerida?: string;
  impacto?: string;
  origem?: string;
  fallback?: boolean;
  status?: string;
  payloadAcao?: Record<string, any>;
};

export type DailyBriefingData = {
  updatedAt?: string;
  weather?: {
    temp: string;
    condition: string;
    location: string;
    date: string;
  };
  metrics?: {
    salesForecast: string;
    salesDiff: string;
    peakHour: string;
    peakRange: string;
    stockAlertsCount: number;
    modelAccuracy: string;
    accuracyDiff: string;
    isRegionalEstimate?: boolean;
  };
  customerFlow?: { hour: string; value: number; highlight?: boolean }[];
  alerts?: { id: string; badge: string; title: string; description: string }[];
  replenishment?: {
    id: string;
    product: string;
    actionTime: string;
    suggestedQty: string;
  }[];
  opportunity?: { title: string; description: string };
  // RF09: Campo de Insight textual gerado pela IA / Otimizador Heurístico
  aiInsight?: AiInsightItem;
  aiInsights?: AiInsightItem[];
};

export async function fetchDailyBriefing(): Promise<DailyBriefingData | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/dashboard/daily-briefing`,
      withAuth({ cache: "no-store" }),
    );

    if (response.status === 401) {
      redirectToLogin();
      return null;
    }

    if (!response.ok) return null;

    return (await response.json()) as DailyBriefingData;
  } catch {
    return null;
  }
}

export async function fetchDailyRecommendations(): Promise<AiInsightItem[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/recommendations/daily`,
      withAuth({ cache: "no-store" }),
    );
    if (response.status === 401) { redirectToLogin(); return []; }
    if (!response.ok) return [];
    const data = await response.json();
    const list = Array.isArray(data) ? data : [];
    return list.map((item: any) => ({
      id: item.id,
      categoria: item.categoria,
      title: item.titulo,
      text: `${item.diagnostico} -> ${item.acaoSugerida}`,
      diagnostico: item.diagnostico,
      acaoSugerida: item.acaoSugerida,
      impacto: item.impactoEstimado,
      origem: item.origem,
      fallback: item.fallback,
      status: item.status,
      payloadAcao: item.payloadAcao,
    }));
  } catch {
    return [];
  }
}

export async function applyRecommendation(id: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_URL}/api/recommendations/${id}/apply`,
      withAuth({ method: "PATCH" }),
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function dismissRecommendation(id: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_URL}/api/recommendations/${id}/dismiss`,
      withAuth({ method: "PATCH" }),
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function regenerateRecommendations(): Promise<AiInsightItem[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/recommendations/regenerate`,
      withAuth({ method: "POST" }),
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.id,
        categoria: item.categoria,
        title: item.titulo,
        text: `${item.diagnostico} -> ${item.acaoSugerida}`,
        diagnostico: item.diagnostico,
        acaoSugerida: item.acaoSugerida,
        impacto: item.impactoEstimado,
        origem: item.origem,
        fallback: item.fallback,
        status: item.status,
        payloadAcao: item.payloadAcao,
      }));
    } else if (data && typeof data === "object") {
      return [{
        id: data.id,
        categoria: data.categoria,
        title: data.titulo,
        text: `${data.diagnostico} -> ${data.acaoSugerida}`,
        diagnostico: data.diagnostico,
        acaoSugerida: data.acaoSugerida,
        impacto: data.impactoEstimado,
        origem: data.origem,
        fallback: data.fallback,
        status: data.status,
        payloadAcao: data.payloadAcao,
      }];
    }
    return [];
  } catch {
    return [];
  }
}

export async function regenerateRecommendation(): Promise<AiInsightItem | null> {
  const list = await regenerateRecommendations();
  return list.length > 0 ? list[0] : null;
}

export const EXAMPLE_BRIEFING: DailyBriefingData = {
  weather: {
    temp: "28°C",
    condition: "Ensolarado",
    location: "Recife, PE",
    date: "Quarta, 12 jun",
  },
  metrics: {
    salesForecast: "R$ 4.850",
    salesDiff: "+18%",
    peakHour: "18:00",
    peakRange: "entre 17h e 19h",
    stockAlertsCount: 3,
    modelAccuracy: "91,8%",
    accuracyDiff: "+2,4%",
  },
  // RF09: Dica/Insight gerado pelo motor preditivo
  aiInsight: {
    categoria: "ESTOQUE",
    title: "Reposição Urgente: Óleo e Lubrificantes",
    text: "Estoque crítico de lubrificantes abaixo da margem mínima. Sugerimos reposição até as 15h.",
    diagnostico: "Estoque atual (0 un.) abaixo do nível de segurança (16 un.).",
    acaoSugerida: "Emitir pedido emergencial de 48 unidades hoje.",
    impacto: "Evita rupturas e perda direta de vendas",
    origem: "IA_GEMINI",
    fallback: false,
    status: "PENDENTE",
  },
  aiInsights: [
    {
      categoria: "ESTOQUE",
      title: "Reposição Urgente: Óleo e Lubrificantes",
      text: "Estoque crítico de lubrificantes abaixo da margem mínima. Sugerimos reposição até as 15h.",
      diagnostico: "Estoque atual (0 un.) abaixo do nível de segurança (16 un.).",
      acaoSugerida: "Emitir pedido emergencial de 48 unidades hoje.",
      impacto: "Evita rupturas e perda direta de vendas",
      origem: "IA_GEMINI",
      fallback: false,
      status: "PENDENTE",
    },
    {
      categoria: "EQUIPE",
      title: "Reorganização para Box Expresso às 18h",
      text: "Turno de pico chuvoso das 18h com alta demanda de serviços rápidos.",
      diagnostico: "2 colaboradores escalados para o horário de ápice com chuva em Boa Viagem.",
      acaoSugerida: "Deslocar 1 funcionário para triagem no balcão e agilizar o pátio entre 17h e 19h.",
      impacto: "Redução de até 35% no tempo de fila",
      origem: "IA_GEMINI",
      fallback: false,
      status: "PENDENTE",
    },
    {
      categoria: "PROMOCAO",
      title: "Campanha 'Drive Safe na Chuva' no WhatsApp",
      text: "Chuva no Grande Recife eleva procura por palhetas, lâmpadas e freios.",
      diagnostico: "Percepção de risco de condutores no trânsito pesado sob chuva.",
      acaoSugerida: "Disparar mensagem no WhatsApp com 'Check-up Gratuito' e 10% off em palhetas.",
      impacto: "+25% em serviços adicionais",
      origem: "IA_GEMINI",
      fallback: false,
      status: "PENDENTE",
    },
    {
      categoria: "PREVISAO",
      title: "Preparação de Bancada para Pico das 18h",
      text: "Fluxo intenso previsto na Conselheiro Aguiar a partir das 17h.",
      diagnostico: "Pico de 86 veículos/hora projetado para o início da noite.",
      acaoSugerida: "Deixar insumos de alta rotação pré-separados 30 minutos antes do pico.",
      impacto: "Operação fluida sem atrasos",
      origem: "IA_GEMINI",
      fallback: false,
      status: "PENDENTE",
    },
  ],
  customerFlow: [
    { hour: "08h", value: 30 },
    { hour: "10h", value: 42 },
    { hour: "12h", value: 55 },
    { hour: "14h", value: 48 },
    { hour: "16h", value: 68 },
    { hour: "18h", value: 86, highlight: true },
    { hour: "20h", value: 60 },
  ],
  alerts: [
    {
      id: "1",
      badge: "Ruptura prevista",
      title: "Leite integral",
      description: "Restam 8 unidades. Estoque acaba antes das 16h.",
    },
    {
      id: "2",
      badge: "Próximo ao vencimento",
      title: "Iogurte natural",
      description: "12 unidades vencem em 2 dias. Considere uma promoção.",
    },
    {
      id: "3",
      badge: "Alta demanda",
      title: "Pico no fim do dia",
      description: "Movimento 32% acima da média entre 17h e 19h.",
    },
  ],
  replenishment: [
    {
      id: "1",
      product: "Leite integral",
      actionTime: "Comprar até 10h",
      suggestedQty: "24 un.",
    },
    {
      id: "2",
      product: "Farinha de trigo",
      actionTime: "Comprar até 14h",
      suggestedQty: "15 kg",
    },
    {
      id: "3",
      product: "Café em grãos",
      actionTime: "Comprar amanhã",
      suggestedQty: "8 un.",
    },
  ],
  opportunity: {
    title: "Uma promoção pode salvar sua margem.",
    description:
      "Ofereça até 18% de desconto nos iogurtes e preserve uma margem positiva de 12%.",
  },
};
