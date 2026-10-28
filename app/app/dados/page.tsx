"use client";

import { useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { SaleForm, type SaleFormData } from "../components/SaleForm";
import { useToast } from "../components/ToastProvider";
import { createSale, uploadSalesFile } from "../lib/api";

const MOCK_PRODUCTS = [
  { id: "1", name: "Leite integral" },
  { id: "2", name: "Iogurte natural" },
  { id: "3", name: "Farinha de trigo" },
  { id: "4", name: "Café em grãos" },
  { id: "5", name: "Refrigerante lata" },
];

export default function DadosPage() {
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
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 sm:mb-8">
        <p className="eyebrow">Ingestão multicanal</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Central de dados
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Alimente o protótipo por entrada manual, planilha, foto ou integrações
          de venda.
        </p>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-2 xl:gap-6">
        <section className="panel">
          <p className="eyebrow">Upload inteligente</p>
          <h2 className="section-title">Importar arquivo ou foto</h2>

          <div className="mt-5">
            <Dropzone
              file={file}
              onFileChange={setFile}
              disabled={isUploading}
            />
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
          <p className="eyebrow">Entrada manual</p>
          <h2 className="section-title mb-5">Registrar movimento</h2>

          <SaleForm products={MOCK_PRODUCTS} onSubmit={handleSaleSubmit} />
        </section>
      </div>
    </main>
  );
}