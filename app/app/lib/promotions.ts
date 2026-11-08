// Enquanto a rota não entra na develop, o cálculo é feito aqui, com dados de exemplo.

export type PromotionStatus = "APROVADO" | "RISCO_FINANCEIRO";

export type PromotionSimulation = {
  productId: string;
  produto: string;
  custo: number;
  precoAtual: number;
  margemAtualPercentual: number;
  descontoMaximoPercentual: number;
  precoMinimo: number;
  descontoAplicadoPercentual: number | null;
  novoPreco: number | null;
  novaMargemPercentual: number | null;
  lucroUnitario: number | null;
  status: PromotionStatus | null;
};

export type SampleProduct = {
  id: string;
  name: string;
  cost: number;
  price: number;
};

export type SimulationInput = {
  discountPercentage?: number;
  targetPrice?: number;
};

export type MarginLevel = "saudavel" | "risco" | "prejuizo";

// Margem a partir da qual consideramos saudável (valor de exemplo).
export const HEALTHY_MARGIN_PERCENT = 15;

// Dados de exemplo. Depois trocar pela lista de produtos vinda da API.
export const SAMPLE_PRODUCTS: SampleProduct[] = [
  { id: "1", name: "Pão francês (kg)", cost: 9.5, price: 16 },
  { id: "2", name: "Café 500g", cost: 14, price: 22.9 },
  { id: "3", name: "Leite integral 1L", cost: 4.2, price: 6.5 },
  { id: "4", name: "Bolo de chocolate (fatia)", cost: 4.8, price: 9 },
];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function marginLevel(marginPercent: number): MarginLevel {
  if (marginPercent < 0) return "prejuizo";
  if (marginPercent < HEALTHY_MARGIN_PERCENT) return "risco";
  return "saudavel";
}

export function simulatePromotion(
  product: SampleProduct,
  input: SimulationInput,
): PromotionSimulation {
  const margemAtual = round2(
    ((product.price - product.cost) / product.price) * 100,
  );

  const base = {
    productId: product.id,
    produto: product.name,
    custo: product.cost,
    precoAtual: product.price,
    margemAtualPercentual: margemAtual,
    // Desconto em que o preço iguala o custo.
    descontoMaximoPercentual: margemAtual,
    precoMinimo: product.cost,
  };

  let discount: number | null = null;
  if (input.discountPercentage !== undefined) {
    discount = input.discountPercentage;
  } else if (input.targetPrice !== undefined) {
    discount = ((product.price - input.targetPrice) / product.price) * 100;
  }

  if (discount === null) {
    return {
      ...base,
      descontoAplicadoPercentual: null,
      novoPreco: null,
      novaMargemPercentual: null,
      lucroUnitario: null,
      status: null,
    };
  }

  const applied = Math.min(Math.max(discount, 0), 100);
  const novoPreco = round2(product.price * (1 - applied / 100));
  const novaMargem =
    novoPreco > 0
      ? round2(((novoPreco - product.cost) / novoPreco) * 100)
      : -100;

  return {
    ...base,
    descontoAplicadoPercentual: round2(applied),
    novoPreco,
    novaMargemPercentual: novaMargem,
    lucroUnitario: round2(novoPreco - product.cost),
    status: novoPreco >= product.cost ? "APROVADO" : "RISCO_FINANCEIRO",
  };
}