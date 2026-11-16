"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  fetchProducts,
  simulatePromotionApi,
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  fetchHolidays,
  type ProductItem,
  type CampaignItem,
  type HolidayData,
} from "../lib/api";
import {
  fetchDailyRecommendations,
  applyRecommendation,
  type AiInsightItem,
} from "../lib/dashboard";
import { useToast } from "../components/ToastProvider";

export default function PromocoesPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayData[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [horarioInicio, setHorarioInicio] = useState<string>("18:00");
  const [horarioFim, setHorarioFim] = useState<string>("22:00");

  // Estados do Simulador de Desconto e Criação de Campanha
  const [tituloCampanha, setTituloCampanha] = useState<string>("");
  const [eventoSelecionado, setEventoSelecionado] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("Hoje");
  const [dataFim, setDataFim] = useState<string>("Próximos 7 dias");
  const [precoAtual, setPrecoAtual] = useState<string>("8.50");
  const [custoUnitario, setCustoUnitario] = useState<string>("5.20");
  const [desconto, setDesconto] = useState<number>(18);
  const [backendStatus, setBackendStatus] = useState<"APROVADO" | "RISCO_FINANCEIRO" | null>("APROVADO");

  // Lista de Campanhas e Edição
  const [campanhas, setCampanhas] = useState<CampaignItem[]>([]);
  const [loadingCampanhas, setLoadingCampanhas] = useState<boolean>(true);
  const [savingCampaign, setSavingCampaign] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);

  // Insight Real da IA para Promoções
  const [promoInsight, setPromoInsight] = useState<AiInsightItem | null>(null);
  const [loadingInsight, setLoadingInsight] = useState<boolean>(true);
  const [isAiApplied, setIsAiApplied] = useState<boolean>(false);
  const [isSimulatorHighlighted, setIsSimulatorHighlighted] = useState<boolean>(false);

  // Carrega produtos, campanhas, feriados/eventos regionais e recomendação da IA
  useEffect(() => {
    let ignore = false;
    async function load() {
      const [list, camps, hols, recommendations] = await Promise.all([
        fetchProducts(),
        fetchCampaigns(),
        fetchHolidays("Recife", "PE"),
        fetchDailyRecommendations(),
      ]);
      if (!ignore) {
        if (list && list.length > 0) {
          setProducts(list);
          const first = list[0];
          setSelectedProductId(first.id);
          setSelectedProductIds([first.id]);
          if (first.precoVenda) setPrecoAtual(String(first.precoVenda));
          if (first.custoUnidade) setCustoUnitario(String(first.custoUnidade));
          setTituloCampanha(`Oferta Especial: ${first.nome}`);
        }
        setCampanhas(camps);
        setHolidays(hols);
        setLoadingCampanhas(false);

        const match = (recommendations || []).find((r) => r.categoria === "PROMOCAO");
        if (match) {
          setPromoInsight(match);
          if (match.status === "APLICADO") {
            setIsAiApplied(true);
          }
        }
        setLoadingInsight(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  // Recalcula totais de preço e custo para combos de múltiplos produtos
  const recalculateComboPrices = (prodIds: string[]) => {
    const chosen = products.filter((p) => prodIds.includes(p.id));
    if (chosen.length === 0) {
      setSelectedProductId("");
      return;
    }
    setSelectedProductId(chosen[0].id);

    const sumPreco = chosen.reduce((acc, p) => acc + (p.precoVenda || 0), 0);
    const sumCusto = chosen.reduce((acc, p) => acc + (p.custoUnidade || 0), 0);
    setPrecoAtual(sumPreco > 0 ? sumPreco.toFixed(2) : "0.00");
    setCustoUnitario(sumCusto > 0 ? sumCusto.toFixed(2) : "0.00");

    if (!eventoSelecionado) {
      if (chosen.length === 1) {
        setTituloCampanha(`Oferta: ${chosen[0].nome} (-${desconto}%)`);
      } else if (chosen.length === 2) {
        setTituloCampanha(`Combo: ${chosen[0].nome} + ${chosen[1].nome} (-${desconto}%)`);
      } else {
        setTituloCampanha(`Combo Promocional (${chosen.length} itens) (-${desconto}%)`);
      }
    } else {
      if (chosen.length === 1) {
        setTituloCampanha(`Especial ${eventoSelecionado}: ${chosen[0].nome}`);
      } else {
        setTituloCampanha(`Especial ${eventoSelecionado}: Combo (${chosen.length} itens)`);
      }
    }
  };

  const handleAddProductToPromo = (id: string) => {
    if (!id || selectedProductIds.includes(id)) return;
    const updated = [...selectedProductIds, id];
    setSelectedProductIds(updated);
    recalculateComboPrices(updated);
  };

  const handleRemoveProductFromPromo = (id: string) => {
    const updated = selectedProductIds.filter((pId) => pId !== id);
    setSelectedProductIds(updated);
    recalculateComboPrices(updated);
  };

  const handleSelectAllProducts = () => {
    const allIds = products.map((p) => p.id);
    setSelectedProductIds(allIds);
    recalculateComboPrices(allIds);
  };

  // Quando seleciona um evento ou feriado regional
  const handleSelectEvent = (nomeEvento: string) => {
    setEventoSelecionado(nomeEvento);
    const chosen = products.filter((p) => selectedProductIds.includes(p.id));
    let baseName = "Produto";
    if (chosen.length === 1) {
      baseName = chosen[0].nome;
    } else if (chosen.length > 1) {
      baseName = `Combo (${chosen.length} itens)`;
    }
    if (nomeEvento) {
      setTituloCampanha(`Especial ${nomeEvento}: ${baseName}`);
    } else {
      setTituloCampanha(`Oferta Especial: ${baseName}`);
    }
  };

  // Cálculos reativos imediatos do simulador
  const { precoPromocional, margemFinal, descontoMaximo } = useMemo(() => {
    const preco = parseFloat(precoAtual.replace(",", ".")) || 0;
    const custo = parseFloat(custoUnitario.replace(",", ".")) || 0;

    const promo = preco * (1 - desconto / 100);
    const margem = promo > 0 ? ((promo - custo) / promo) * 100 : 0;
    const descMax = preco > 0 && preco > custo ? ((preco - custo) / preco) * 100 : 0;

    return {
      precoPromocional: promo > 0 ? promo.toFixed(2) : "0,00",
      margemFinal: margem.toFixed(1),
      descontoMaximo: Math.max(0, Math.floor(descMax)),
    };
  }, [precoAtual, custoUnitario, desconto]);

  // Consulta o motor do backend de promoções quando os valores mudam
  useEffect(() => {
    let ignore = false;
    async function checkBackend() {
      if (!selectedProductId) {
        setBackendStatus(Number(margemFinal) >= 15 ? "APROVADO" : "RISCO_FINANCEIRO");
        return;
      }
      const sim = await simulatePromotionApi(selectedProductId, desconto);
      if (!ignore && sim) {
        setBackendStatus(sim.status ?? (Number(margemFinal) >= 15 ? "APROVADO" : "RISCO_FINANCEIRO"));
      } else if (!ignore) {
        setBackendStatus(Number(margemFinal) >= 15 ? "APROVADO" : "RISCO_FINANCEIRO");
      }
    }
    void checkBackend();
    return () => {
      ignore = true;
    };
  }, [selectedProductId, desconto, margemFinal]);

  const extractedDiscount = useMemo(() => {
    if (!promoInsight) return 15;
    if (promoInsight.payloadAcao?.desconto && typeof promoInsight.payloadAcao.desconto === "number") {
      return promoInsight.payloadAcao.desconto;
    }
    if (promoInsight.payloadAcao?.descontoPercentual && typeof promoInsight.payloadAcao.descontoPercentual === "number") {
      return promoInsight.payloadAcao.descontoPercentual;
    }
    const text = `${promoInsight.acaoSugerida || ""} ${promoInsight.title || ""}`;
    const match = text.match(/(\d{1,2})%/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val >= 5 && val <= 70) return val;
    }
    return 15;
  }, [promoInsight]);

  // Horários inferidos da IA
  const suggestedTimeRange = useMemo(() => {
    let inicio = "18:00";
    let fim = "22:00";

    if (promoInsight?.payloadAcao?.horarioInicio && typeof promoInsight.payloadAcao.horarioInicio === "string") {
      inicio = promoInsight.payloadAcao.horarioInicio;
    }
    if (promoInsight?.payloadAcao?.horarioFim && typeof promoInsight.payloadAcao.horarioFim === "string") {
      fim = promoInsight.payloadAcao.horarioFim;
    }

    const fullText = `${promoInsight?.acaoSugerida || ""} ${promoInsight?.title || ""} ${promoInsight?.diagnostico || ""}`;
    const timeMatch = fullText.match(/(\d{1,2})(?:[h:](\d{2}))?\s*(?:às|as|a|até|-)\s*(\d{1,2})(?:[h:](\d{2}))?/i);
    if (timeMatch && (!promoInsight?.payloadAcao?.horarioInicio || !promoInsight?.payloadAcao?.horarioFim)) {
      const h1 = parseInt(timeMatch[1], 10);
      const m1 = timeMatch[2] ? timeMatch[2] : "00";
      const h2 = parseInt(timeMatch[3], 10);
      const m2 = timeMatch[4] ? timeMatch[4] : "00";
      if (h1 >= 0 && h1 <= 23 && h2 >= 0 && h2 <= 23) {
        inicio = `${String(h1).padStart(2, "0")}:${m1}`;
        fim = `${String(h2).padStart(2, "0")}:${m2}`;
      }
    }

    return { inicio, fim };
  }, [promoInsight]);

  // Datas inferidas da IA
  const suggestedDates = useMemo(() => {
    let inicio = "Hoje";
    let fim = "Próximos 7 dias";

    if (promoInsight?.payloadAcao?.dataInicio && typeof promoInsight.payloadAcao.dataInicio === "string") {
      inicio = promoInsight.payloadAcao.dataInicio;
    }
    if (promoInsight?.payloadAcao?.dataFim && typeof promoInsight.payloadAcao.dataFim === "string") {
      fim = promoInsight.payloadAcao.dataFim;
    } else {
      const evName = promoInsight?.payloadAcao?.evento;
      if (evName && typeof evName === "string") {
        const h = holidays.find(
          (hol) =>
            hol.nome.toLowerCase().includes(evName.toLowerCase()) ||
            evName.toLowerCase().includes(hol.nome.toLowerCase())
        );
        if (h && h.data) {
          fim = h.data;
        }
      }
    }

    return { inicio, fim };
  }, [promoInsight, holidays]);

  // Produtos inferidos da IA (individual ou combo)
  const suggestedProducts = useMemo(() => {
    if (!promoInsight || products.length === 0) return [];
    const fullText = `${promoInsight.title || ""} ${promoInsight.diagnostico || ""} ${promoInsight.acaoSugerida || ""}`.toLowerCase();
    const isCombo = Boolean(
      promoInsight.payloadAcao?.isCombo ||
      promoInsight.payloadAcao?.tipoAcao === "COMBO_TICKET" ||
      fullText.includes("combo") ||
      fullText.includes("2 produtos") ||
      fullText.includes("maior saída") ||
      fullText.includes("casad")
    );

    // 1. IDs explícitos no payload
    if (Array.isArray(promoInsight.payloadAcao?.productIds) && promoInsight.payloadAcao.productIds.length > 0) {
      const ids = promoInsight.payloadAcao.productIds.filter((id: any) => typeof id === "string");
      const found = products.filter((p) => ids.includes(p.id));
      if (found.length > 0) return found;
    }

    // 2. Nomes de produtos explícitos no payload
    if (Array.isArray(promoInsight.payloadAcao?.produtos) && promoInsight.payloadAcao.produtos.length > 0) {
      const nomes = promoInsight.payloadAcao.produtos.map((n: any) => String(n).toLowerCase());
      const found = products.filter((p) =>
        nomes.some((nome: string) => p.nome.toLowerCase().includes(nome) || nome.includes(p.nome.toLowerCase()))
      );
      if (found.length > 0) return found;
    }

    // 3. Produto único explícito no payload
    if (promoInsight.payloadAcao?.productId && typeof promoInsight.payloadAcao.productId === "string") {
      const p = products.find((prod) => prod.id === promoInsight.payloadAcao?.productId);
      if (p) return [p];
    }
    if (promoInsight.payloadAcao?.produto && typeof promoInsight.payloadAcao.produto === "string") {
      const pName = promoInsight.payloadAcao.produto.toLowerCase();
      const p = products.find((prod) => prod.nome.toLowerCase().includes(pName) || pName.includes(prod.nome.toLowerCase()));
      if (p) return [p];
    }

    // 4. Busca por nomes de produtos do catálogo no texto
    const matched = products.filter((p) => fullText.includes(p.nome.toLowerCase()));
    if (matched.length > 0) {
      return matched;
    }

    // 5. Se for combo e não achou nomes específicos, seleciona os 2 primeiros do catálogo
    if (isCombo && products.length >= 2) {
      return [products[0], products[1]];
    }

    // 6. Fallback padrão: primeiro item do catálogo
    return [products[0]];
  }, [promoInsight, products]);

  const handleAplicarSugestaoIA = async () => {
    if (!promoInsight) return;

    // 1. Aplica produtos sugeridos (individual ou combo) e recalcula preços/custos
    if (suggestedProducts.length > 0) {
      const prodIds = suggestedProducts.map((p) => p.id);
      setSelectedProductIds(prodIds);
      setSelectedProductId(prodIds[0]);

      const sumPreco = suggestedProducts.reduce((acc, p) => acc + (p.precoVenda || 0), 0);
      const sumCusto = suggestedProducts.reduce((acc, p) => acc + (p.custoUnidade || 0), 0);
      setPrecoAtual(sumPreco > 0 ? sumPreco.toFixed(2) : "0.00");
      setCustoUnitario(sumCusto > 0 ? sumCusto.toFixed(2) : "0.00");
    }

    // 2. Vincula evento ou feriado regional se identificado no payload ou texto
    let matchedHolidayName = "";
    if (promoInsight.payloadAcao?.evento && typeof promoInsight.payloadAcao.evento === "string") {
      const evName = promoInsight.payloadAcao.evento.toLowerCase();
      const matchedHoliday = holidays.find(
        (h) => h.nome.toLowerCase().includes(evName) || evName.includes(h.nome.toLowerCase())
      );
      if (matchedHoliday) {
        matchedHolidayName = matchedHoliday.nome;
      }
    }
    if (!matchedHolidayName) {
      const textToSearch = `${promoInsight.title} ${promoInsight.diagnostico || ""} ${promoInsight.acaoSugerida || ""}`.toLowerCase();
      const matchedHoliday = holidays.find((h) => textToSearch.includes(h.nome.toLowerCase()));
      if (matchedHoliday) {
        matchedHolidayName = matchedHoliday.nome;
      }
    }
    setEventoSelecionado(matchedHolidayName);

    // 3. Aplica datas de início e término
    setDataInicio(suggestedDates.inicio);
    setDataFim(suggestedDates.fim);

    // 4. Aplica horários de início e término (Happy Hour ou Pico)
    setHorarioInicio(suggestedTimeRange.inicio);
    setHorarioFim(suggestedTimeRange.fim);

    // 5. Aplica título e o desconto sugerido no simulador
    if (promoInsight.title) {
      setTituloCampanha(promoInsight.title);
    }
    setDesconto(extractedDiscount);

    // 6. Marca estado ativo e faz o simulador piscar em destaque visual
    setIsAiApplied(true);
    setIsSimulatorHighlighted(true);
    setTimeout(() => setIsSimulatorHighlighted(false), 2200);

    // 7. Registra a aplicação no backend
    if (promoInsight.id) {
      void applyRecommendation(promoInsight.id);
    }

    const prodNames = suggestedProducts.map((p) => p.nome).join(" + ") || "itens";
    showToast(
      "success",
      `Sugestão completa da IA aplicada: ${extractedDiscount}% OFF, ${suggestedTimeRange.inicio} às ${suggestedTimeRange.fim}, [${prodNames}] e datas preenchidas!`,
    );
  };

  const handleSalvarSimulacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCampaign(true);

    const chosen = products.filter((p) => selectedProductIds.includes(p.id));
    let prodName = "Produto";
    if (chosen.length === 1) {
      prodName = chosen[0].nome;
    } else if (chosen.length > 1) {
      prodName = `Combo (${chosen.length} itens)`;
    }

    const finalTitle = tituloCampanha.trim() || `${prodName} (-${desconto}%)`;
    const numMargem = Number(margemFinal);
    const precoNum = parseFloat(precoPromocional.replace(",", "."));

    const created = await createCampaign({
      productId: selectedProductIds[0] || selectedProductId || undefined,
      productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      titulo: finalTitle,
      detalhe: `Preço R$ ${precoPromocional} (Margem: ${margemFinal}%)`,
      descontoPercentual: desconto,
      precoPromocional: precoNum,
      status: "Ativa",
      data: dataInicio,
      dataFim: dataFim,
      horarioInicio: horarioInicio || undefined,
      horarioFim: horarioFim || undefined,
      eventoVinculado: eventoSelecionado || undefined,
    });

    setSavingCampaign(false);

    if (created) {
      setCampanhas((prev) => [created, ...prev]);
      showToast(
        numMargem >= 15 ? "success" : "error",
        numMargem >= 15
          ? `Campanha "${created.titulo}" salva e ativada!`
          : `Atenção: Campanha salva, mas margem projetada de ${margemFinal}% está na faixa de risco.`,
      );
    } else {
      showToast("error", "Não foi possível salvar a campanha no momento.");
    }
  };

  const handleUpdateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    const updated = await updateCampaign(editingCampaign.id, {
      productId: editingCampaign.productId,
      productIds: editingCampaign.productIds,
      titulo: editingCampaign.titulo,
      detalhe: editingCampaign.detalhe,
      descontoPercentual: editingCampaign.descontoPercentual ?? 0,
      precoPromocional: editingCampaign.precoPromocional ?? 0,
      status: editingCampaign.status,
      data: editingCampaign.data,
      dataFim: editingCampaign.dataFim,
      horarioInicio: editingCampaign.horarioInicio,
      horarioFim: editingCampaign.horarioFim,
      eventoVinculado: editingCampaign.eventoVinculado,
    });

    if (updated) {
      setCampanhas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast("success", "Campanha atualizada com sucesso!");
      setEditingCampaign(null);
    } else {
      showToast("error", "Não foi possível atualizar a campanha.");
    }
  };

  const handleDeleteCampanha = async (id: string) => {
    const ok = await deleteCampaign(id);
    if (ok) {
      setCampanhas((prev) => prev.filter((c) => c.id !== id));
      showToast("success", "Campanha removida com sucesso.");
    } else {
      showToast("error", "Não foi possível remover a campanha.");
    }
  };

  return (
    <div className="min-h-screen bg-[#111214] text-white">
      {/* Topbar / Subheader */}
      <header className="border-b border-white/[0.06] px-4 py-3 sm:px-8 flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#8e8f94] uppercase">
          Campanhas e Precificação
        </span>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        {/* Cabeçalho */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
              Margem Protegida (RF05)
            </span>
            <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Promoções e Campanhas
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#8e8f94] max-w-2xl leading-relaxed">
              Crie promoções personalizadas, vincule a feriados de Recife e liquide itens sem comprometer seu lucro.
            </p>
          </div>
        </div>

        {/* Linha Superior: Simulador (Esquerda) + Sugestão Inteligente (Direita) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch mb-6">
          {/* Card: Simulador de Desconto */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div
              className={`h-full rounded-2xl border bg-[#16171a] p-5 sm:p-7 shadow-sm flex flex-col justify-between transition-all duration-300 ${
                isSimulatorHighlighted
                  ? "border-[#d6ff00] ring-2 ring-[#d6ff00]/40 shadow-xl shadow-[#d6ff00]/10"
                  : "border-white/[0.08]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                    Simulador e Criador de Campanha
                  </span>
                  {backendStatus && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        backendStatus === "APROVADO"
                          ? "bg-[#d6ff00]/15 text-[#d6ff00] border border-[#d6ff00]/30"
                          : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {backendStatus === "APROVADO" ? "Margem Segura" : "Risco Financeiro"}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                  Configure sua campanha
                </h2>

                <form onSubmit={handleSalvarSimulacao} className="mt-6 space-y-4">
                  {/* Nome da Campanha */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1.5">
                      Nome / Título da Campanha
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={150}
                      value={tituloCampanha}
                      onChange={(e) => setTituloCampanha(e.target.value)}
                      placeholder="Ex: Arraiá do Bolo de Rolo, Combo Café da Manhã"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#1f2024] px-4 py-2.5 text-sm text-white focus:border-[#d6ff00] focus:outline-none"
                    />
                  </div>

                  {/* Vinculação a Evento ou Feriado de Recife/PE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#8e8f94] mb-1.5">
                        Vincular a Feriado / Data de Recife & PE
                      </label>
                      <select
                        value={eventoSelecionado}
                        onChange={(e) => handleSelectEvent(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#d6ff00] focus:outline-none [color-scheme:dark]"
                      >
                        <option value="">Nenhum / Campanha Própria</option>
                        {holidays.map((h, idx) => (
                          <option key={`${h.nome}-${idx}`} value={h.nome}>
                            🎉 {h.nome} ({h.data})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Produtos participantes (individual ou múltiplos) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-medium text-[#8e8f94]">
                          Produtos participantes
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#d6ff00] font-semibold">
                            {selectedProductIds.length === 0
                              ? "Nenhum"
                              : selectedProductIds.length === 1
                              ? "1 item"
                              : `${selectedProductIds.length} itens (Combo)`}
                          </span>
                          {products.length > 1 && (
                            <button
                              type="button"
                              onClick={handleSelectAllProducts}
                              className="text-[10px] text-zinc-400 hover:text-[#d6ff00] underline"
                            >
                              {selectedProductIds.length === products.length ? "Todos selecionados" : "Todos"}
                            </button>
                          )}
                        </div>
                      </div>

                      <select
                        id="select-product-promo"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleAddProductToPromo(e.target.value);
                        }}
                        className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#d6ff00] focus:outline-none [color-scheme:dark]"
                      >
                        <option value="">+ Adicionar produto à promoção...</option>
                        {products.map((p) => {
                          const isSel = selectedProductIds.includes(p.id);
                          return (
                            <option key={p.id} value={p.id} disabled={isSel}>
                              {isSel ? `✓ ${p.nome}` : p.nome} (R$ {Number(p.precoVenda || 0).toFixed(2)})
                            </option>
                          );
                        })}
                      </select>

                      {/* Chips de produtos selecionados */}
                      {selectedProductIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {selectedProductIds.map((pId) => {
                            const prod = products.find((p) => p.id === pId);
                            return (
                              <span
                                key={pId}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#282a2f] border border-white/10 px-2.5 py-1 text-xs text-white"
                              >
                                <span>{prod ? prod.nome : pId}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductFromPromo(pId)}
                                  className="text-zinc-400 hover:text-red-400 transition ml-0.5"
                                  title="Remover produto da promoção"
                                >
                                  ✕
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Período da Campanha */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#8e8f94] mb-1.5">
                        Início da Campanha (Data)
                      </label>
                      <input
                        type="text"
                        maxLength={50}
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        placeholder="Ex: Hoje, 20/06, Próxima Sexta"
                        className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-3.5 py-2 text-xs sm:text-sm text-white focus:border-[#d6ff00] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8e8f94] mb-1.5">
                        Término da Campanha (Data)
                      </label>
                      <input
                        type="text"
                        maxLength={50}
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        placeholder="Ex: 24/06, Fim do mês"
                        className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-3.5 py-2 text-xs sm:text-sm text-white focus:border-[#d6ff00] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Horário da Promoção (Início e Término) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#8e8f94] mb-1.5 flex items-center justify-between">
                        <span>Horário de Início</span>
                        <span className="text-[10px] text-zinc-500">Ex: 18:00 (Happy Hour)</span>
                      </label>
                      <input
                        type="time"
                        value={horarioInicio}
                        onChange={(e) => setHorarioInicio(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-3.5 py-2 text-xs sm:text-sm text-white focus:border-[#d6ff00] focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8e8f94] mb-1.5 flex items-center justify-between">
                        <span>Horário de Término</span>
                        <span className="text-[10px] text-zinc-500">Ex: 22:00</span>
                      </label>
                      <input
                        type="time"
                        value={horarioFim}
                        onChange={(e) => setHorarioFim(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-3.5 py-2 text-xs sm:text-sm text-white focus:border-[#d6ff00] focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Inputs de Preço e Custo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label htmlFor="input-preco-atual" className="block text-xs font-medium text-[#8e8f94] mb-1.5">
                        Preço atual
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-xs font-semibold text-[#8e8f94]">
                          R$
                        </span>
                        <input
                          id="input-preco-atual"
                          type="text"
                          value={precoAtual}
                          onChange={(e) => setPrecoAtual(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#d6ff00] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="input-custo-unitario" className="block text-xs font-medium text-[#8e8f94] mb-1.5">
                        Custo unitário
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-xs font-semibold text-[#8e8f94]">
                          R$
                        </span>
                        <input
                          id="input-custo-unitario"
                          type="text"
                          value={custoUnitario}
                          onChange={(e) => setCustoUnitario(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#d6ff00] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slider de Desconto */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-[#8e8f94]">
                        Desconto aplicado: <strong className="text-white">{desconto}%</strong>
                      </span>
                      <span className="text-xs text-muted">
                        Limite sugerido: <strong className="text-[#d6ff00]">{descontoMaximo}%</strong>
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={desconto}
                        onChange={(e) => setDesconto(Number(e.target.value))}
                        className="w-full h-2 bg-[#282a2f] rounded-lg appearance-none cursor-pointer accent-[#d6ff00]"
                        style={{
                          background: `linear-gradient(to right, #d6ff00 ${desconto}%, #282a2f ${desconto}%)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Mini Cards de Resultados */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="rounded-xl border border-white/[0.05] bg-[#1f2024] p-3 sm:p-4">
                      <p className="text-[11px] text-[#8e8f94]">Preço promocional</p>
                      <p className="mt-1 text-base sm:text-lg font-bold text-white">
                        R$ {precoPromocional.replace(".", ",")}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.05] bg-[#1f2024] p-3 sm:p-4">
                      <p className="text-[11px] text-[#8e8f94]">Margem projetada</p>
                      <p
                        className={`mt-1 text-base sm:text-lg font-bold ${
                          Number(margemFinal) <= 0 ? "text-red-400" : "text-[#d6ff00]"
                        }`}
                      >
                        {margemFinal}%
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.05] bg-[#1f2024] p-3 sm:p-4">
                      <p className="text-[11px] text-[#8e8f94]">Desconto máximo</p>
                      <p className="mt-1 text-base sm:text-lg font-bold text-white">
                        {descontoMaximo}%
                      </p>
                    </div>
                  </div>

                  {/* Botão Salvar Simulação */}
                  <button
                    type="submit"
                    disabled={savingCampaign}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#d6ff00] text-[#111214] font-bold text-sm tracking-wide transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center"
                  >
                    {savingCampaign ? "Salvando campanha..." : "Salvar e ativar campanha promocional"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Card: Sugestão Inteligente da IA (Alimentado com dados reais da IA) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div
              className={`h-full rounded-2xl border p-5 sm:p-7 shadow-sm flex flex-col justify-between transition ${
                isAiApplied
                  ? "border-emerald-500/30 bg-emerald-950/10"
                  : promoInsight?.fallback || promoInsight?.origem === "HEURISTICA_FALLBACK"
                  ? "border-amber-500/25 bg-[#16171a]"
                  : "border-[#d6ff00]/25 bg-[#16171a]"
              }`}
            >
              {loadingInsight ? (
                <div className="space-y-4 animate-pulse py-4">
                  <div className="h-4 w-32 bg-white/10 rounded-full" />
                  <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
                  <div className="h-20 w-full bg-white/5 rounded-xl" />
                  <div className="h-16 w-full bg-white/5 rounded-xl" />
                </div>
              ) : promoInsight ? (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00] flex items-center gap-1.5">
                        <span>✨</span>
                        <span>Sugestão Inteligente da IA</span>
                      </span>

                      {promoInsight.fallback || promoInsight.origem === "HEURISTICA_FALLBACK" ? (
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-300">
                          ⚡ Contingência
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#d6ff00]/15 border border-[#d6ff00]/30 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#d6ff00]">
                          ✨ Gemini IA
                        </span>
                      )}
                    </div>

                    <h2 className="mt-1 text-base sm:text-lg font-bold text-white leading-snug">
                      {promoInsight.title}
                    </h2>

                    {/* Destaque de Desconto e Impacto Esperado */}
                    <div className="mt-5 flex items-start justify-between rounded-xl bg-white/[0.03] border border-white/5 p-4">
                      <div>
                        <p className="text-[11px] text-[#8e8f94]">Desconto sugerido</p>
                        <p className="mt-0.5 text-2xl sm:text-3xl font-extrabold text-white">
                          {extractedDiscount}% OFF
                        </p>
                      </div>
                      {promoInsight.impacto && (
                        <div className="text-right">
                          <p className="text-[11px] text-[#8e8f94]">Impacto esperado</p>
                          <span className="mt-0.5 inline-block rounded-full bg-[#d6ff00]/10 border border-[#d6ff00]/25 px-2.5 py-1 text-[10px] font-bold text-[#d6ff00]">
                            {promoInsight.impacto}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Diagnóstico do motor */}
                    {promoInsight.diagnostico && (
                      <p className="mt-4 text-xs text-[#8e8f94] leading-relaxed">
                        <strong className="text-white/80">Diagnóstico:</strong> {promoInsight.diagnostico}
                      </p>
                    )}

                    {/* Ação Prescritiva */}
                    {promoInsight.acaoSugerida && (
                      <div className="mt-3 rounded-xl bg-white/[0.04] p-3 text-xs text-white leading-relaxed">
                        <span className="font-semibold text-[#d6ff00]">Ação recomendada: </span>
                        {promoInsight.acaoSugerida}
                      </div>
                    )}

                    {/* Resumo dos parâmetros que a IA preencherá */}
                    <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                        <span className="text-[#8e8f94] block font-medium">⏰ Horário da promoção:</span>
                        <span className="text-white font-bold">{suggestedTimeRange.inicio} às {suggestedTimeRange.fim}</span>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                        <span className="text-[#8e8f94] block font-medium">📅 Período sugerido:</span>
                        <span className="text-white font-bold">{suggestedDates.inicio} até {suggestedDates.fim}</span>
                      </div>
                      <div className="col-span-1 sm:col-span-2 rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                        <span className="text-[#8e8f94] block font-medium">
                          📦 {suggestedProducts.length > 1 ? `Combo sugerido (${suggestedProducts.length} itens):` : "Produto sugerido:"}
                        </span>
                        <span className="text-[#d6ff00] font-semibold">
                          {suggestedProducts.map((p) => p.nome).join(" + ") || "Catálogo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col gap-2.5">
                    {isAiApplied && (
                      <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <span>✓</span>
                          <span>Recomendação registrada no sistema</span>
                        </span>
                        <span className="text-[10px] text-emerald-300/70">Ativa</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAplicarSugestaoIA}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#d6ff00] text-[#111214] text-xs sm:text-sm font-bold transition hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#d6ff00]/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{isAiApplied ? "↻" : "✨"}</span>
                      <span>
                        {isAiApplied
                          ? `Reaplicar sugestão completa da IA`
                          : `Preencher tudo no formulário com IA`}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-xs text-[#8e8f94]">
                  <p className="font-semibold text-white">Sem recomendação de promoção para hoje</p>
                  <p className="mt-1 text-[11px]">Você pode acionar o recalcular de IA no dashboard a qualquer momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linha Inferior: Campanhas Ativas e Programadas */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                Campanhas
              </span>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                Ativas e programadas
              </h2>
            </div>
            {campanhas.length > 0 && (
              <span className="text-xs text-[#8e8f94]">
                Total: <strong className="text-white">{campanhas.length}</strong>
              </span>
            )}
          </div>

          {loadingCampanhas ? (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : campanhas.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
              <p className="text-sm font-semibold text-white">Nenhuma campanha cadastrada ainda</p>
              <p className="mt-1 text-xs text-[#8e8f94]">
                Configure um título, selecione o desconto e clique em &ldquo;Salvar e ativar campanha promocional&rdquo;.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campanhas.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/[0.07] bg-[#1f2024] p-4 flex flex-col justify-between hover:border-white/20 transition-all duration-150 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.status === "Ativa"
                            ? "bg-[#d6ff00]/15 text-[#d6ff00] border border-[#d6ff00]/30"
                            : item.status === "Pausada"
                            ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                            : "bg-white/10 text-[#8e8f94] border border-white/10"
                        }`}
                      >
                        {item.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8e8f94]">
                          {item.data} {item.dataFim ? `até ${item.dataFim}` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingCampaign({ ...item })}
                          className="text-[#8e8f94] hover:text-[#d6ff00] p-1 rounded transition"
                          title="Editar campanha"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteCampanha(item.id);
                          }}
                          className="text-[#8e8f94] hover:text-red-400 p-1.5 rounded transition opacity-80 group-hover:opacity-100 hover:bg-red-500/10 cursor-pointer"
                          title="Remover campanha"
                          aria-label="Remover campanha"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-white">{item.titulo}</h3>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {item.eventoVinculado && (
                          <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
                            🎉 {item.eventoVinculado}
                          </span>
                        )}

                        {(item.horarioInicio || item.horarioFim) && (
                          <span className="inline-flex items-center gap-1 rounded bg-[#d6ff00]/10 border border-[#d6ff00]/25 px-2 py-0.5 text-[10px] font-semibold text-[#d6ff00]">
                            ⏰ {item.horarioInicio && item.horarioFim
                              ? `${item.horarioInicio} às ${item.horarioFim}`
                              : item.horarioInicio
                              ? `A partir de ${item.horarioInicio}`
                              : `Até ${item.horarioFim}`}
                          </span>
                        )}

                        {item.productIds && item.productIds.length > 1 && (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
                            📦 Combo ({item.productIds.length} produtos)
                          </span>
                        )}
                      </div>

                      {item.detalhe && <p className="mt-1.5 text-xs text-[#8e8f94]">{item.detalhe}</p>}

                      {/* Nomes dos produtos vinculados */}
                      {item.productIds && item.productIds.length > 1 ? (
                        <p className="mt-1 text-[11px] text-zinc-400 line-clamp-1" title={products.filter((p) => item.productIds?.includes(p.id)).map((p) => p.nome).join(", ")}>
                          Itens: {products
                            .filter((p) => item.productIds?.includes(p.id))
                            .map((p) => p.nome)
                            .join(", ")}
                        </p>
                      ) : (
                        (() => {
                          const pId = item.productId || (item.productIds && item.productIds[0]);
                          const prod = products.find((p) => p.id === pId);
                          return prod ? (
                            <p className="mt-1 text-[11px] text-zinc-400">
                              Produto: {prod.nome}
                            </p>
                          ) : null;
                        })()
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Edição de Campanha */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#16171a] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-lg font-bold text-white">Editar Campanha</h3>
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCampaignSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white mb-1">Título</label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={editingCampaign.titulo}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, titulo: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3.5 py-2 text-sm text-white focus:border-[#d6ff00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1">Status</label>
                <select
                  value={editingCampaign.status}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3.5 py-2 text-sm text-white focus:border-[#d6ff00] focus:outline-none [color-scheme:dark]"
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Pausada">Pausada</option>
                  <option value="Encerrada">Encerrada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white mb-1">Início (Data)</label>
                  <input
                    type="text"
                    value={editingCampaign.data || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, data: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3 py-2 text-xs text-white focus:border-[#d6ff00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white mb-1">Término (Data)</label>
                  <input
                    type="text"
                    value={editingCampaign.dataFim || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, dataFim: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3 py-2 text-xs text-white focus:border-[#d6ff00] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white mb-1">Horário Início</label>
                  <input
                    type="time"
                    value={editingCampaign.horarioInicio || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, horarioInicio: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3 py-2 text-xs text-white focus:border-[#d6ff00] focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white mb-1">Horário Término</label>
                  <input
                    type="time"
                    value={editingCampaign.horarioFim || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, horarioFim: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3 py-2 text-xs text-white focus:border-[#d6ff00] focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              {editingCampaign.productIds && editingCampaign.productIds.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#8e8f94] mb-1">Produtos no Combo</label>
                  <div className="text-xs text-zinc-300 bg-[#1f2024] border border-white/10 rounded-xl p-2.5">
                    {products
                      .filter((p) => editingCampaign.productIds?.includes(p.id))
                      .map((p) => p.nome)
                      .join(", ") || `${editingCampaign.productIds.length} produtos`}
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteCampanha(editingCampaign.id);
                    setEditingCampaign(null);
                  }}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition cursor-pointer text-center"
                >
                  Excluir Campanha
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCampaign(null)}
                    className="flex-1 sm:flex-none rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none rounded-xl bg-[#d6ff00] px-4 py-2.5 text-xs font-bold text-black hover:brightness-105"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
