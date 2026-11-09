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
import { useToast } from "../components/ToastProvider";

export default function PromocoesPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayData[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

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

  // Carrega produtos, campanhas e feriados/eventos regionais
  useEffect(() => {
    let ignore = false;
    async function load() {
      const [list, camps, hols] = await Promise.all([
        fetchProducts(),
        fetchCampaigns(),
        fetchHolidays("Recife", "PE"),
      ]);
      if (!ignore) {
        if (list && list.length > 0) {
          setProducts(list);
          const first = list[0];
          setSelectedProductId(first.id);
          if (first.precoVenda) setPrecoAtual(String(first.precoVenda));
          if (first.custoUnidade) setCustoUnitario(String(first.custoUnidade));
          setTituloCampanha(`Oferta Especial: ${first.nome}`);
        }
        setCampanhas(camps);
        setHolidays(hols);
        setLoadingCampanhas(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  // Quando troca o produto no select
  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      if (prod.precoVenda) setPrecoAtual(String(prod.precoVenda));
      if (prod.custoUnidade) setCustoUnitario(String(prod.custoUnidade));
      if (!eventoSelecionado) {
        setTituloCampanha(`Oferta: ${prod.nome} (-${desconto}%)`);
      } else {
        setTituloCampanha(`Especial ${eventoSelecionado}: ${prod.nome}`);
      }
    }
  };

  // Quando seleciona um evento ou feriado regional
  const handleSelectEvent = (nomeEvento: string) => {
    setEventoSelecionado(nomeEvento);
    const prod = products.find((p) => p.id === selectedProductId);
    const nomeProd = prod ? prod.nome : "Produto";
    if (nomeEvento) {
      setTituloCampanha(`Especial ${nomeEvento}: ${nomeProd}`);
    } else {
      setTituloCampanha(`Oferta Especial: ${nomeProd}`);
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

  const aplicarSugestao = () => {
    setDesconto(18);
    showToast("success", "Sugestão inteligente aplicada: 18% OFF.");
  };

  const handleSalvarSimulacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCampaign(true);

    const selectedProd = products.find((p) => p.id === selectedProductId);
    const prodName = selectedProd ? selectedProd.nome : "Produto";
    const finalTitle = tituloCampanha.trim() || `${prodName} (-${desconto}%)`;
    const numMargem = Number(margemFinal);
    const precoNum = parseFloat(precoPromocional.replace(",", "."));

    const created = await createCampaign({
      productId: selectedProductId || undefined,
      titulo: finalTitle,
      detalhe: `Preço R$ ${precoPromocional} (Margem: ${margemFinal}%)`,
      descontoPercentual: desconto,
      precoPromocional: precoNum,
      status: "Ativa",
      data: dataInicio,
      dataFim: dataFim,
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
      titulo: editingCampaign.titulo,
      detalhe: editingCampaign.detalhe,
      descontoPercentual: editingCampaign.descontoPercentual ?? 0,
      precoPromocional: editingCampaign.precoPromocional ?? 0,
      status: editingCampaign.status,
      data: editingCampaign.data,
      dataFim: editingCampaign.dataFim,
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
            <div className="h-full rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-7 shadow-sm flex flex-col justify-between">
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

                    {/* Produto cadastrado */}
                    <div>
                      <label htmlFor="select-product-promo" className="block text-xs font-medium text-[#8e8f94] mb-1.5">
                        Produto selecionado
                      </label>
                      <select
                        id="select-product-promo"
                        value={selectedProductId}
                        onChange={(e) => handleSelectProduct(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#d6ff00] focus:outline-none [color-scheme:dark]"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Período da Campanha */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#8e8f94] mb-1.5">
                        Início da Campanha
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
                        Término da Campanha
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

          {/* Card: Sugestão Inteligente */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="h-full rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-7 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                  Sugestão Inteligente da IA
                </span>
                <h2 className="mt-1 text-lg sm:text-xl font-bold text-white leading-snug">
                  Itens próximos do vencimento
                </h2>

                <div className="mt-6 flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-[#8e8f94]">Lote em risco de perda</p>
                    <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-white">
                      18% OFF
                    </p>
                  </div>
                  <span className="rounded-full bg-[#d6ff00]/10 border border-[#d6ff00]/20 px-2.5 py-1 text-[10px] font-bold text-[#d6ff00]">
                    Margem +12%
                  </span>
                </div>

                <p className="mt-6 text-xs sm:text-sm text-[#8e8f94] leading-relaxed">
                  Com esta oferta calculada pelo motor preditivo, a probabilidade de giro do lote sobe para 84%, prevenindo perdas financeiras na operação.
                </p>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={aplicarSugestao}
                  className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs sm:text-sm font-semibold transition hover:bg-white/10 active:scale-[0.99]"
                >
                  Aplicar sugestão recomendada
                </button>
              </div>
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
                          onClick={() => handleDeleteCampanha(item.id)}
                          className="text-[#8e8f94] hover:text-red-400 p-1 rounded transition opacity-80 group-hover:opacity-100"
                          title="Remover campanha"
                          aria-label="Remover campanha"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-white">{item.titulo}</h3>
                      {item.eventoVinculado && (
                        <span className="mt-1 inline-block rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
                          🎉 {item.eventoVinculado}
                        </span>
                      )}
                      {item.detalhe && <p className="mt-1 text-xs text-[#8e8f94]">{item.detalhe}</p>}
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
                  <label className="block text-xs font-medium text-white mb-1">Início</label>
                  <input
                    type="text"
                    value={editingCampaign.data || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, data: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3 py-2 text-xs text-white focus:border-[#d6ff00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white mb-1">Término</label>
                  <input
                    type="text"
                    value={editingCampaign.dataFim || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, dataFim: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3 py-2 text-xs text-white focus:border-[#d6ff00] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#d6ff00] py-2.5 text-xs font-bold text-black hover:brightness-105"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
