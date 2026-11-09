"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchReplenishmentSuggestions,
  fetchAlerts,
  resolveAlert,
  addStarterKit,
  getTenantSettings,
  type ReplenishmentSuggestionDto,
  type OperationalAlertDto,
} from "../lib/api";
import { getTenantId } from "../lib/auth";
import { useToast } from "../components/ToastProvider";
import { DashboardSkeleton } from "../components/DashboardSkeleton";

export default function EstoquePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stockItems, setStockItems] = useState<ReplenishmentSuggestionDto[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlertDto[]>([]);
  const [search, setSearch] = useState("");
  const [filterRuptureOnly, setFilterRuptureOnly] = useState(false);
  const [isAddingStarterKit, setIsAddingStarterKit] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [items, activeAlerts] = await Promise.all([
        fetchReplenishmentSuggestions(false),
        fetchAlerts("ATIVO"),
      ]);
      setStockItems(items);
      setAlerts(activeAlerts);
      setLoading(false);
    }
    void loadData();
  }, []);

  const handleResolveAlert = async (id: string) => {
    const ok = await resolveAlert(id);
    if (ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      showToast("success", "Alerta resolvido com sucesso!");
    } else {
      showToast("error", "Não foi possível resolver o alerta.");
    }
  };

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchesSearch =
        item.produto.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterRuptureOnly
        ? item.comprarAgora || item.estoqueAtual <= item.estoqueMinimo
        : true;
      return matchesSearch && matchesFilter;
    });
  }, [stockItems, search, filterRuptureOnly]);

  const criticalCount = useMemo(() => {
    return stockItems.filter(
      (item) => item.comprarAgora || item.estoqueAtual <= item.estoqueMinimo,
    ).length;
  }, [stockItems]);

  if (loading) {
    return (
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        <DashboardSkeleton />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#111214] text-white">
      {/* Topbar / Subheader */}
      <header className="border-b border-white/[0.06] px-4 py-3 sm:px-8 flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#8e8f94] uppercase">
          Monitoramento e Prevenção de Perdas
        </span>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        {/* Cabeçalho */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
              Controle Operacional
            </span>
            <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Estoque e Rupturas
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#8e8f94] max-w-2xl leading-relaxed">
              Acompanhe a disponibilidade física em tempo real e antecipe a reposição antes do esgotamento.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/compras"
              className="inline-flex items-center gap-2 rounded-xl bg-[#d6ff00] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#111214] transition hover:brightness-105 active:scale-[0.99]"
            >
              <span>Ver lista de compras</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8f94]">
              Itens Monitorados
            </span>
            <p className="mt-2 text-3xl font-extrabold text-white">
              {stockItems.length}
            </p>
            <p className="mt-1 text-xs text-muted">cadastrados no sistema</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8f94]">
                Ruptura Iminente
              </span>
              {criticalCount > 0 && (
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
                  ATENÇÃO
                </span>
              )}
            </div>
            <p className={`mt-2 text-3xl font-extrabold ${criticalCount > 0 ? "text-red-400" : "text-[#d6ff00]"}`}>
              {criticalCount} {criticalCount === 1 ? "item" : "itens"}
            </p>
            <p className="mt-1 text-xs text-muted">abaixo do nível de segurança</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8f94]">
              Alertas Ativos
            </span>
            <p className="mt-2 text-3xl font-extrabold text-white">
              {alerts.length}
            </p>
            <p className="mt-1 text-xs text-muted">gerados pelo motor preditivo</p>
          </div>
        </div>

        {/* Painel de Alertas Operacionais */}
        {alerts.length > 0 && (
          <section className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-red-400 font-bold text-sm">🚨 Alertas Operacionais de Estoque</span>
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                {alerts.length} pendentes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl border border-white/10 bg-[#16171a] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="rounded bg-red-500/15 px-2 py-0.5 text-[9px] font-bold uppercase text-red-300">
                        {alert.tipo.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-muted">{alert.prioridade}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{alert.titulo}</h3>
                    <p className="mt-1 text-xs text-[#8e8f94] leading-relaxed">
                      {alert.descricao}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResolveAlert(alert.id)}
                    className="mt-4 w-full rounded-lg border border-white/10 py-1.5 text-center text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Marcar como resolvido ✓
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tabela de Posição de Estoque */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-7 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                Inventário
              </span>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                Posição física e cobertura
              </h2>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#1f2024] px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-[#d6ff00] focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setFilterRuptureOnly((prev) => !prev)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  filterRuptureOnly
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "border border-white/10 bg-white/5 text-muted hover:text-white"
                }`}
              >
                {filterRuptureOnly ? "Apenas em ruptura ✓" : "Filtrar rupturas"}
              </button>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-white">
                {stockItems.length === 0
                  ? "Nenhum produto com movimentação de estoque ainda."
                  : "Nenhum item encontrado com os filtros aplicados."}
              </p>
              <p className="mt-2 text-xs text-muted max-w-md mx-auto">
                {stockItems.length === 0
                  ? "Importe planilhas de venda ou cadastre entradas na Central de Dados para o motor preditivo calcular as coberturas."
                  : "Tente buscar por outro termo ou desmarque o filtro de ruptura."}
              </p>
              {stockItems.length === 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={isAddingStarterKit}
                    onClick={async () => {
                      setIsAddingStarterKit(true);
                      const id = getTenantId();
                      let tenantNicho: string | undefined;
                      if (id) {
                        const settings = await getTenantSettings(id);
                        if (settings?.nichoAtuacao) {
                          tenantNicho = settings.nichoAtuacao;
                        }
                      }
                      const res = await addStarterKit(undefined, tenantNicho);
                      setIsAddingStarterKit(false);
                      if (res && res.length > 0) {
                        showToast("success", "Itens padrão do segmento adicionados ao estoque!");
                        const items = await fetchReplenishmentSuggestions(false);
                        setStockItems(items);
                      } else {
                        showToast("error", "Não foi possível adicionar os itens do segmento.");
                      }
                    }}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition disabled:opacity-50"
                  >
                    {isAddingStarterKit ? "Adicionando..." : "⚡ Adicionar itens comuns do segmento"}
                  </button>
                  <Link
                    href="/dados"
                    className="inline-block rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
                  >
                    Ir para Central de Dados
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-[#8e8f94]">
                    <th className="py-3.5 px-4 font-semibold">Produto</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Estoque Atual</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Mín / Máx</th>
                    <th className="py-3.5 px-4 font-semibold">Nível de Cobertura</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Ação Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredItems.map((item) => {
                    const isCritical =
                      item.comprarAgora || item.estoqueAtual <= item.estoqueMinimo;
                    const max = Math.max(item.estoqueMaximo || 100, item.estoqueAtual, 1);
                    const percent = Math.min(100, Math.round((item.estoqueAtual / max) * 100));

                    return (
                      <tr key={item.productId} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">{item.produto}</p>
                          <p className="text-[10px] text-muted">Método: {item.metodo}</p>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-white">
                          <span className={isCritical ? "text-red-400" : "text-white"}>
                            {item.estoqueAtual} un.
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center text-muted">
                          {item.estoqueMinimo} / {item.estoqueMaximo} un.
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="w-36">
                            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isCritical
                                    ? "bg-red-400"
                                    : percent < 50
                                    ? "bg-amber-400"
                                    : "bg-[#d6ff00]"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="mt-1 block text-[9px] text-[#8e8f94]">
                              {percent}% da capacidade máxima
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-300">
                              Repor {item.quantidadeSugerida} un.
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#d6ff00]/10 px-2.5 py-1 text-[10px] font-semibold text-[#d6ff00]">
                              Estoque OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
