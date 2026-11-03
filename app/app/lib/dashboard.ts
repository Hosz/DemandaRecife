const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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
};

export async function fetchDailyBriefing(): Promise<DailyBriefingData | null> {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/daily-briefing`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    return (await response.json()) as DailyBriefingData;
  } catch {
    return null;
  }
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