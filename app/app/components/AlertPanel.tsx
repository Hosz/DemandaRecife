export function AlertPanel() {
  return (
    <section
      role="status"
      className="flex items-start gap-3 rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 sm:p-6"
    >
      <span aria-hidden="true" className="text-xl leading-none">
        ⚠️
      </span>
      <div>
        <p className="font-semibold text-amber-300">Atenção</p>
        <p className="mt-1 text-sm text-white">
          Movimento acima do normal na Sexta às 19h - Considere reforçar o caixa.
        </p>
      </div>
    </section>
  );
}