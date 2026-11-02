import { PurchaseList } from "../components/PurchaseList";

export default function ComprasPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6">
        <p className="eyebrow">Prescrição de compras</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          O que e quando comprar
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sugestões baseadas na sua venda média e no tempo de entrega.
        </p>
      </header>

      <PurchaseList />
    </main>
  );
}