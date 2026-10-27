"use client";

import { SaleForm, type SaleFormData } from "./components/SaleForm";
import { useToast } from "./components/ToastProvider";

const MOCK_PRODUCTS = [
  { id: 1, name: "Leite integral" },
  { id: 2, name: "Iogurte natural" },
  { id: 3, name: "Farinha de trigo" },
  { id: 4, name: "Café em grãos" },
  { id: 5, name: "Refrigerante lata" },
];

export default function Home() {
  const { showToast } = useToast();

  async function handleSaleSubmit(data: SaleFormData) {
    // simula o envio ao servidor
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Venda enviada:", data);
    showToast("success", "Venda registrada com sucesso");
    return true;
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <section className="panel">
        <p className="eyebrow">Teste de formulário</p>
        <h1 className="section-title mb-5">Registrar venda</h1>

        <SaleForm products={MOCK_PRODUCTS} onSubmit={handleSaleSubmit} />
      </section>
    </main>
  );
}