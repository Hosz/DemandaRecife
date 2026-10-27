"use client";

import { useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { SaleForm, type SaleFormData } from "./components/SaleForm";
import { useToast } from "./components/ToastProvider";
import { createSale, uploadSalesFile } from "./lib/api";

const MOCK_PRODUCTS = [
  { id: "1", name: "Leite integral" },
  { id: "2", name: "Iogurte natural" },
  { id: "3", name: "Farinha de trigo" },
  { id: "4", name: "Café em grãos" },
  { id: "5", name: "Refrigerante lata" },
];
export default function Home() {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload() {
    if (!file || isUploading) return;

    setIsUploading(true);
    const result = await uploadSalesFile(file);
    setIsUploading(false);

    showToast(result.ok ? "success" : "error", result.message);

    if (result.ok) {
      setFile(null);
    }
  }

  async function handleSaleSubmit(data: SaleFormData) {
    const result = await createSale(data);
    showToast(result.ok ? "success" : "error", result.message);
    return result.ok;
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <section className="panel">
        <p className="eyebrow">Histórico</p>
        <h2 className="section-title">Importar arquivo</h2>

        <div className="mt-5">
          <Dropzone file={file} onFileChange={setFile} disabled={isUploading} />
        </div>

        <button
          className="primary-button mt-5"
          type="button"
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? "Enviando..." : "Enviar arquivo"}
        </button>
      </section>

      <section className="panel">
        <p className="eyebrow">Venda avulsa</p>
        <h2 className="section-title mb-5">Registrar venda</h2>

        <SaleForm products={MOCK_PRODUCTS} onSubmit={handleSaleSubmit} />
      </section>
    </main>
  );
}