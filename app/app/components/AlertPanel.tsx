"use client";

interface AlertPanelProps {
  onApplySuggestion?: () => void;
  isApplied?: boolean;
}

export function AlertPanel({
  onApplySuggestion,
  isApplied = false,
}: AlertPanelProps) {
  return (
    <section
      role="status"
      className="space-y-4 rounded-3xl bg-[#D4FF00] p-5 text-black sm:p-6 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <span className="text-base">✨</span>
        <span className="text-xs font-bold uppercase tracking-wider">
          Recomendação da IA
        </span>
      </div>

      <div>
        <h3 className="text-lg font-bold">Ajuste prioritário</h3>
        <p className="mt-1 text-sm font-medium leading-relaxed">
          <strong>Reforce o fechamento:</strong> Adicione 1 pessoa entre 17h e 21h. O fluxo previsto é 32% maior que a média.
        </p>
      </div>

      <button
        type="button"
        disabled={isApplied}
        onClick={onApplySuggestion}
        className="w-full rounded-2xl bg-black py-3.5 text-center text-sm font-bold text-[#D4FF00] transition-transform active:scale-98 hover:bg-zinc-900 disabled:opacity-50"
      >
        {isApplied ? "✓ Escala sugerida já aplicada" : "Aplicar escala sugerida"}
      </button>
    </section>
  );
}
