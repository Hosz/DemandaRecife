import { PromotionSimulator } from "../components/PromotionSimulator";

export default function PromocoesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6">
        <p className="eyebrow">Simulador de promoções</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Até onde posso dar desconto?
        </h1>
        <p className="mt-2 text-sm text-muted">
          Simule um desconto ou um preço final e veja o impacto na sua margem
          antes de lançar a promoção.
        </p>
      </header>

      <PromotionSimulator />
    </main>
  );
}