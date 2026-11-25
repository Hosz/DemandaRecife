"use client";

import type { AiInsightItem } from "../lib/dashboard";

interface AlertPanelProps {
  insight?: AiInsightItem | null;
  loading?: boolean;
  onApplySuggestion?: () => void;
  isApplied?: boolean;
  suggestedHorario?: string;
  suggestedCollaborator?: string;
}

export function AlertPanel({
  insight,
  loading = false,
  onApplySuggestion,
  isApplied = false,
  suggestedHorario,
  suggestedCollaborator,
}: AlertPanelProps) {
  if (loading) {
    return (
      <section
        role="status"
        className="space-y-4 rounded-3xl bg-[#D4FF00] p-5 text-black sm:p-6 shadow-lg animate-pulse"
      >
        <div className="h-4 w-36 bg-black/20 rounded-full" />
        <div className="h-6 w-1/2 bg-black/20 rounded-lg" />
        <div className="h-10 w-full bg-black/10 rounded-xl" />
        <div className="h-12 w-full bg-black/20 rounded-2xl" />
      </section>
    );
  }

  // Fallback se ainda não houver recomendação carregada
  const title = insight?.title || "Ajuste prioritário";
  const acao = insight?.acaoSugerida || "Reforce o fechamento: Adicione 1 pessoa entre 17h e 21h.";
  const diagnostico = insight?.diagnostico || "O fluxo previsto é 32% maior que a média.";
  const impacto = insight?.impacto || "Atendimento até 30% mais ágil";

  return (
    <section
      role="status"
      className="space-y-4 rounded-3xl bg-[#D4FF00] p-5 text-black sm:p-6 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <span className="text-xs font-bold uppercase tracking-wider">
            Recomendação da IA
          </span>
        </div>
        {insight?.origem === "GEMINI_API" && (
          <span className="rounded-full bg-black/15 px-2.5 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
            Gemini IA
          </span>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm font-medium leading-relaxed">
          <strong>{acao}</strong> {diagnostico}
        </p>

        {(suggestedHorario || suggestedCollaborator || impacto) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
            {suggestedHorario && (
              <span className="rounded-xl bg-black/10 px-3 py-1">
                ⏰ Turno: <strong>{suggestedHorario}</strong>
              </span>
            )}
            {suggestedCollaborator && (
              <span className="rounded-xl bg-black/10 px-3 py-1">
                👤 Colaborador: <strong>{suggestedCollaborator}</strong>
              </span>
            )}
            {impacto && (
              <span className="rounded-xl bg-black/10 px-3 py-1">
                📈 Impacto: <strong>{impacto}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={isApplied}
        onClick={onApplySuggestion}
        className="w-full rounded-2xl bg-black py-3.5 text-center text-sm font-bold text-[#D4FF00] transition-transform active:scale-98 hover:bg-zinc-900 disabled:opacity-50 cursor-pointer"
      >
        {isApplied ? "✓ Escala sugerida já aplicada" : "Aplicar escala sugerida"}
      </button>
    </section>
  );
}
