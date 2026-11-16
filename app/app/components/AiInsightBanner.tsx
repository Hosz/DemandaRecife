"use client";

import { useEffect, useState } from "react";
import { fetchDailyRecommendations, type AiInsightItem } from "../lib/dashboard";

type Category = "ESTOQUE" | "EQUIPE" | "PROMOCAO" | "PREVISAO";

const CATEGORY_LABEL: Record<Category, string> = {
  ESTOQUE: "📦 Estoque & Compras",
  EQUIPE: "👥 Equipe & Escala",
  PROMOCAO: "🏷️ Promoções",
  PREVISAO: "📈 Previsão & Demanda",
};

interface AiInsightBannerProps {
  category: Category;
}

export function AiInsightBanner({ category }: AiInsightBannerProps) {
  const [insight, setInsight] = useState<AiInsightItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const all = await fetchDailyRecommendations();
      if (!cancelled) {
        const match = all.find((r) => r.categoria === category) ?? null;
        setInsight(match);
        setLoading(false);
        setApplied(match?.status === "APLICADO");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [category]);

  if (loading) {
    return (
      <div className="mb-6 animate-pulse rounded-2xl border border-white/[0.06] bg-[#16171a] p-5">
        <div className="mb-2 h-3 w-28 rounded-full bg-white/10" />
        <div className="mb-1 h-4 w-2/3 rounded-full bg-white/10" />
        <div className="h-3 w-full rounded-full bg-white/10" />
      </div>
    );
  }

  if (!insight || dismissed) return null;

  const isAi = insight.origem === "IA_GEMINI" || !insight.fallback;
  const isFallback = insight.origem === "HEURISTICA_FALLBACK" || insight.fallback;

  return (
    <div
      className={`mb-6 rounded-2xl border p-5 shadow-sm transition ${
        applied
          ? "border-emerald-500/30 bg-emerald-900/10"
          : isFallback
          ? "border-amber-500/25 bg-amber-900/10"
          : "border-[#d6ff00]/20 bg-[#d6ff00]/[0.04]"
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8e8f94]">
            Insight IA — {CATEGORY_LABEL[category]}
          </span>
          {isFallback ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
              Contingência
            </span>
          ) : (
            <span className="rounded-full bg-[#d6ff00]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#d6ff00]">
              Gemini IA
            </span>
          )}
          {applied && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-400">
              ✓ Aplicado
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[11px] text-[#8e8f94] hover:text-white transition"
          title="Fechar insight"
        >
          ✕
        </button>
      </div>

      {/* Título */}
      <h3 className="mb-1 text-sm font-bold text-white">{insight.title}</h3>

      {/* Diagnóstico */}
      {insight.diagnostico && (
        <p className="mb-2 text-xs text-[#8e8f94] leading-relaxed">
          {insight.diagnostico}
        </p>
      )}

      {/* Ação */}
      {insight.acaoSugerida && (
        <div className="mb-3 rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs text-white">
          <span className="font-semibold text-[#d6ff00]">Ação: </span>
          {insight.acaoSugerida}
        </div>
      )}

      {/* Impacto + Ações */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {insight.impacto && (
          <span className="text-[11px] text-[#8e8f94]">
            Impacto estimado:{" "}
            <span className="font-semibold text-white">{insight.impacto}</span>
          </span>
        )}

        {!applied && insight.id && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const { applyRecommendation } = await import("../lib/dashboard");
                const ok = await applyRecommendation(insight.id!);
                if (ok) setApplied(true);
              }}
              className="rounded-xl bg-[#d6ff00] px-3.5 py-1.5 text-[11px] font-bold text-[#111214] hover:brightness-105 transition"
            >
              ✓ Aplicar sugestão
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
