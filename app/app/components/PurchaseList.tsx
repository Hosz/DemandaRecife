"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  fetchReplenishmentSuggestions,
  addStarterKit,
  getTenantSettings,
  type ReplenishmentSuggestionDto,
} from "../lib/api";
import { getTenantId } from "../lib/auth";
import { useToast } from "./ToastProvider";

type Urgency = "hoje" | "amanha" | "semana";

type PurchaseItem = {
  id: string;
  product: string;
  quantity: string;
  deadline: string;
  when: Urgency;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  comprarAgora: boolean;
  metodo: "PREVISAO" | "PADRAO";
};

const URGENCY_ORDER: Record<Urgency, number> = {
  hoje: 0,
  amanha: 1,
  semana: 2,
};

const WHEN_LABEL: Record<Urgency, string> = {
  hoje: "Urgente",
  amanha: "Atenção",
  semana: "Tranquilo",
};

const WHEN_STYLE: Record<Urgency, string> = {
  hoje: "bg-red-500/15 text-red-300 border border-red-500/30",
  amanha: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  semana: "bg-acid/15 text-acid border border-acid/30",
};

export function PurchaseList() {
  const { showToast } = useToast();
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [bought, setBought] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isAddingStarterKit, setIsAddingStarterKit] = useState(false);
  const [tenantNicho, setTenantNicho] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"todos" | "urgentes" | "comprados">("todos");
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const id = getTenantId();
      if (id) {
        const settings = await getTenantSettings(id);
        if (settings?.nichoAtuacao) {
          setTenantNicho(settings.nichoAtuacao);
        }
      }

      const suggestions = await fetchReplenishmentSuggestions(false);
      if (suggestions && suggestions.length > 0) {
        const mapped: PurchaseItem[] = suggestions.map((s: ReplenishmentSuggestionDto) => {
          let when: Urgency = "semana";
          let deadline = "Esta semana (Estoque seguro)";

          if (s.comprarAgora || s.estoqueAtual <= s.estoqueMinimo) {
            when = "hoje";
            deadline = "Até hoje (Estoque crítico / Risco de ruptura)";
          } else if (s.estoqueAtual <= s.estoqueMinimo * 1.5) {
            when = "amanha";
            deadline = "Até amanhã (Reposição preventiva)";
          }

          let quantityStr = `${s.quantidadeSugerida} un.`;
          if (!s.comprarAgora && s.quantidadeSugerida <= 0) {
            const topUp = Math.max(0, s.estoqueMaximo - s.estoqueAtual);
            quantityStr = topUp > 0 ? `+${topUp} un. (opcional)` : "Estoque em dia";
          }

          return {
            id: s.productId,
            product: s.produto,
            quantity: quantityStr,
            deadline,
            when,
            estoqueAtual: s.estoqueAtual,
            estoqueMinimo: s.estoqueMinimo,
            estoqueMaximo: s.estoqueMaximo,
            comprarAgora: s.comprarAgora,
            metodo: s.metodo,
          };
        });
        setItems(mapped);
      } else {
        setItems([]);
      }
      setLoading(false);
    }

    void loadData();
  }, []);

  async function handleAddStarterKit() {
    setIsAddingStarterKit(true);
    try {
      const res = await addStarterKit(undefined, tenantNicho || undefined);
      if (res && res.length > 0) {
        showToast("success", "Insumos e produtos do segmento adicionados com sucesso!");
        const freshSuggestions = await fetchReplenishmentSuggestions(false);
        if (freshSuggestions && freshSuggestions.length > 0) {
          const mapped: PurchaseItem[] = freshSuggestions.map((s: ReplenishmentSuggestionDto) => {
            let when: Urgency = "semana";
            let deadline = "Esta semana (Estoque seguro)";
            if (s.comprarAgora || s.estoqueAtual <= s.estoqueMinimo) {
              when = "hoje";
              deadline = "Até hoje (Estoque crítico)";
            } else if (s.estoqueAtual <= s.estoqueMinimo * 1.5) {
              when = "amanha";
              deadline = "Até amanhã (Reposição preventiva)";
            }
            let quantityStr = `${s.quantidadeSugerida} un.`;
            if (!s.comprarAgora && s.quantidadeSugerida <= 0) {
              const topUp = Math.max(0, s.estoqueMaximo - s.estoqueAtual);
              quantityStr = topUp > 0 ? `+${topUp} un. (opcional)` : "Estoque em dia";
            }
            return {
              id: s.productId,
              product: s.produto,
              quantity: quantityStr,
              deadline,
              when,
              estoqueAtual: s.estoqueAtual,
              estoqueMinimo: s.estoqueMinimo,
              estoqueMaximo: s.estoqueMaximo,
              comprarAgora: s.comprarAgora,
              metodo: s.metodo,
            };
          });
          setItems(mapped);
        }
      } else {
        showToast("error", "Não foi possível carregar o kit inicial.");
      }
    } catch {
      showToast("error", "Erro ao conectar com o servidor.");
    } finally {
      setIsAddingStarterKit(false);
    }
  }

  function toggleBought(id: string) {
    setBought((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  function handleRestoreAll() {
    setDismissed(new Set());
  }

  // Filtra itens não dispensados
  const activeItems = useMemo(() => items.filter((item) => !dismissed.has(item.id)), [items, dismissed]);

  // Contadores
  const stats = useMemo(() => {
    const hoje = activeItems.filter((i) => i.when === "hoje" && !bought.has(i.id)).length;
    const amanha = activeItems.filter((i) => i.when === "amanha" && !bought.has(i.id)).length;
    const semana = activeItems.filter((i) => i.when === "semana" && !bought.has(i.id)).length;
    const totalComprados = bought.size;
    return { hoje, amanha, semana, totalComprados };
  }, [activeItems, bought]);

  // Filtragem conforme o botão selecionado
  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const isDone = bought.has(item.id);
      if (filterMode === "urgentes") {
        return (item.when === "hoje" || item.when === "amanha") && !isDone;
      }
      if (filterMode === "comprados") {
        return isDone;
      }
      return true;
    });
  }, [activeItems, bought, filterMode]);

  // Mais urgentes no topo; itens já comprados vão pro final.
  const sorted = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const doneDiff = Number(bought.has(a.id)) - Number(bought.has(b.id));
      if (doneDiff !== 0) return doneDiff;
      return URGENCY_ORDER[a.when] - URGENCY_ORDER[b.when];
    });
  }, [filteredItems, bought]);

  return (
    <div>
      {/* Barra de carregamento */}
      {loading && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-muted animate-pulse">
          <div className="h-3 w-3 rounded-full bg-acid animate-ping" />
          <span>Sincronizando sugestões com o motor preditivo e base de Cold Start...</span>
        </div>
      )}

      {/* Cartão de Ajuda e Metodologia */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[#17181c] p-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
              ℹ
            </span>
            <span className="font-semibold text-white">Como calculamos a urgência e as quantidades?</span>
          </div>
          <button
            type="button"
            onClick={() => setShowFormulaInfo((prev) => !prev)}
            className="text-acid hover:underline font-medium"
          >
            {showFormulaInfo ? "Ocultar explicação" : "Ver metodologia"}
          </button>
        </div>

        {showFormulaInfo && (
          <div className="mt-3.5 space-y-2 border-t border-white/10 pt-3 text-[#a1a1aa] leading-relaxed">
            <p>
              O sistema utiliza a fórmula de <strong className="text-white">Ponto de Pedido (Estoque Mínimo)</strong>:
              o consumo diário previsto durante o prazo de entrega do fornecedor (Lead Time = 2 dias), acrescido de uma{" "}
              <strong className="text-white">margem de segurança de 25%</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5">
                <span className="font-bold text-red-300">🔴 Urgente (Hoje)</span>
                <p className="mt-1 text-zinc-300">
                  Estoque atual igual ou abaixo do estoque mínimo. Risco iminente de ruptura antes da próxima entrega.
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5">
                <span className="font-bold text-amber-300">🟡 Atenção (Amanhã)</span>
                <p className="mt-1 text-zinc-300">
                  Estoque na margem preventiva (até 1.5x o estoque mínimo). Hora recomendada para emissão do pedido.
                </p>
              </div>
              <div className="rounded-xl border border-acid/20 bg-acid/10 p-2.5">
                <span className="font-bold text-acid">🟢 Tranquilo (Semana)</span>
                <p className="mt-1 text-zinc-300">
                  Estoque abastecido e suficiente para cobrir os próximos 7 dias com segurança.
                </p>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 pt-1">
              * Para novos estabelecimentos sem histórico de vendas (Cold Start), a demanda é calibrada pelas médias
              típicas do segmento para a Região Metropolitana do Recife.
            </p>
          </div>
        )}
      </div>

      {/* Resumo de Indicadores Rápidos */}
      {items.length > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setFilterMode("urgentes")}
            className={`rounded-xl border p-3 text-left transition ${
              filterMode === "urgentes"
                ? "border-red-500/50 bg-red-500/10"
                : "border-white/10 bg-[#17181c] hover:border-white/20"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Urgentes (Hoje)</span>
            <p className="mt-1 text-xl font-extrabold text-white">{stats.hoje}</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("urgentes")}
            className={`rounded-xl border p-3 text-left transition ${
              filterMode === "urgentes"
                ? "border-amber-500/50 bg-amber-500/10"
                : "border-white/10 bg-[#17181c] hover:border-white/20"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Atenção (Amanhã)</span>
            <p className="mt-1 text-xl font-extrabold text-white">{stats.amanha}</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("todos")}
            className={`rounded-xl border p-3 text-left transition ${
              filterMode === "todos"
                ? "border-acid/50 bg-acid/10"
                : "border-white/10 bg-[#17181c] hover:border-white/20"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-acid">Tranquilos (Semana)</span>
            <p className="mt-1 text-xl font-extrabold text-white">{stats.semana}</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("comprados")}
            className={`rounded-xl border p-3 text-left transition ${
              filterMode === "comprados"
                ? "border-indigo-500/50 bg-indigo-500/10"
                : "border-white/10 bg-[#17181c] hover:border-white/20"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Comprados</span>
            <p className="mt-1 text-xl font-extrabold text-white">{stats.totalComprados}</p>
          </button>
        </div>
      )}

      {/* Barra de Filtros e Dispensados */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode("todos")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filterMode === "todos"
                ? "bg-white text-ink"
                : "border border-white/10 bg-white/5 text-muted hover:text-white"
            }`}
          >
            Todos ({activeItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("urgentes")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filterMode === "urgentes"
                ? "bg-red-500 text-white"
                : "border border-white/10 bg-white/5 text-muted hover:text-white"
            }`}
          >
            Apenas Críticos / Urgentes ({stats.hoje + stats.amanha})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("comprados")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filterMode === "comprados"
                ? "bg-acid text-ink font-bold"
                : "border border-white/10 bg-white/5 text-muted hover:text-white"
            }`}
          >
            Comprados ({stats.totalComprados})
          </button>
        </div>

        {dismissed.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            <span>{dismissed.size} sugestão(ões) dispensada(s).</span>
            <button
              type="button"
              onClick={handleRestoreAll}
              className="text-acid hover:underline font-semibold"
            >
              Restaurar todas
            </button>
          </div>
        )}
      </div>

      {/* Estado Vazio ou Lista */}
      {!loading && sorted.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#17181c] p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl">
            {items.length === 0 ? "📦" : "✨"}
          </div>

          <h2 className="mt-4 text-base sm:text-lg font-bold text-white">
            {items.length === 0
              ? "Nenhum insumo cadastrado para gerar prescrição"
              : filterMode === "comprados"
              ? "Nenhum item marcado como comprado ainda"
              : "Nenhum item pendente com os filtros aplicados"}
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-muted leading-relaxed">
            {items.length === 0
              ? `Seu negócio ainda não possui itens no catálogo de estoque. Você pode adicionar os insumos recomendados para ${
                  tenantNicho ? `o segmento "${tenantNicho}"` : "o seu negócio"
                } com 1 clique para ativar o cálculo de reposição automática.`
              : "Todas as compras foram finalizadas ou seus níveis de estoque atuais cobrem a demanda prevista com segurança."}
          </p>

          {items.length === 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={isAddingStarterKit}
                onClick={handleAddStarterKit}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {isAddingStarterKit
                  ? "Carregando insumos..."
                  : `⚡ Adicionar Insumos Recomendados (${tenantNicho || "Segmento"})`}
              </button>
              <Link
                href="/dados"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                Cadastrar Manualmente na Central de Dados
              </Link>
            </div>
          )}

          {items.length > 0 && dismissed.size > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleRestoreAll}
                className="text-xs font-semibold text-acid hover:underline"
              >
                Restaurar sugestões dispensadas
              </button>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((item) => {
            const done = bought.has(item.id);

            return (
              <li
                key={item.id}
                className={`panel flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 transition ${
                  done ? "opacity-45 bg-white/[0.02]" : "hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Botão de Check / Comprado */}
                  <button
                    type="button"
                    onClick={() => toggleBought(item.id)}
                    aria-pressed={done}
                    aria-label={
                      done
                        ? `Desmarcar ${item.product} como comprado`
                        : `Marcar ${item.product} como comprado`
                    }
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-base font-bold transition ${
                      done
                        ? "border-acid bg-acid text-ink shadow-sm"
                        : "border-white/20 text-transparent hover:border-acid hover:text-acid/40"
                    }`}
                  >
                    ✓
                  </button>

                  {/* Informações do Produto */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`truncate font-semibold text-white text-sm ${done ? "line-through text-zinc-400" : ""}`}>
                        {item.product}
                      </p>
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 font-medium">
                        {item.metodo === "PREVISAO" ? "Demanda Prevista" : "Estoque Padrão"}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                      <span>{item.deadline}</span>
                      <span className="text-white/20">•</span>
                      <span>
                        Estoque atual:{" "}
                        <strong className={item.when === "hoje" ? "text-red-300 font-bold" : "text-white"}>
                          {item.estoqueAtual} un.
                        </strong>
                      </span>
                      <span className="text-white/20">•</span>
                      <span>Mínimo: {item.estoqueMinimo} un.</span>
                      <span className="text-white/20">•</span>
                      <span>Máximo: {item.estoqueMaximo} un.</span>
                    </div>
                  </div>
                </div>

                {/* Quantidade Sugerida e Urgência */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                  <div className="text-left sm:text-right">
                    <p className="font-extrabold text-white text-sm sm:text-base">{item.quantity}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${WHEN_STYLE[item.when]}`}
                    >
                      {done ? "Comprado ✓" : WHEN_LABEL[item.when]}
                    </span>
                  </div>

                  {/* Botão de Dispensar Sugestão */}
                  <button
                    type="button"
                    onClick={() => handleDismiss(item.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-xl transition"
                    title="Dispensar sugestão"
                    aria-label={`Dispensar sugestão de ${item.product}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
