"use client";

import { useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { SaleForm, type SaleFormData } from "../components/SaleForm";
import { useToast } from "../components/ToastProvider";
import { createSale, uploadSalesFile } from "../lib/api";
import { IntegrationsSection } from "../components/IntegrationsSection";
import { ImportHistory } from "../components/ImportHistory";

export default function DadosPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  async function handleUpload() {
    if (!file) return;

    setIsUploading(true);

    try {
      const result = await uploadSalesFile(file);

      if (result.ok) {
        showToast("Arquivo enviado com sucesso!", "success");
        setFile(null);
      } else {
        showToast("Não foi possível importar o arquivo.", "error");
      }
    } catch {
      showToast("Erro ao enviar arquivo.", "error");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSaleSubmit(data: SaleFormData) {
    try {
      const result = await createSale(data);

      if (result.ok) {
        showToast("Venda registrada com sucesso!", "success");
      } else {
        showToast("Não foi possível registrar a venda.", "error");
      }

      return result.ok;
    } catch {
      showToast("Erro ao registrar venda.", "error");
      return false;
    }
  }

  return (
    <main className="min-h-screen bg-[#101010] px-5 py-6 text-white sm:px-7">
      <div className="mx-auto max-w-[1200px] space-y-5">

        {/* CABEÇALHO */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d6ff00]">
              Entradas e integrações
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              Central de gerenciamento de dados
            </p>
          </div>
          {/*
          <button
            type="button"
            onClick={() =>
              document.getElementById("registro-venda")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
            className="rounded-lg bg-[#d6ff00] px-4 py-2 text-xs font-bold text-black hover:brightness-90"
          >
            + Nova entrada
          </button>*/}
        </header>

        {/* TÍTULO */}
        <section>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#d6ff00]">
            Ingestão multicanal
          </p>

          <h1 className="text-2xl font-bold tracking-tight">
            Central de dados
          </h1>

          <p className="mt-1 text-xs text-neutral-400">
            Alimente o protótipo por entrada manual, planilha, foto ou integrações de venda.
          </p>
        </section>

        {/* UPLOAD E ENTRADA MANUAL */}
        <section className="grid items-stretch gap-3 lg:grid-cols-2">

          <div className="rounded-2xl border border-white/[0.08] bg-[#191919] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d6ff00]">
              Upload inteligente
            </p>

            <h2 className="mb-3 mt-1 text-sm font-semibold">
              Importar arquivo ou foto
            </h2>

            <Dropzone
              file={file}
              onFileChange={setFile}
            />

            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="primary-button mt-3 !rounded-lg !py-2 !text-xs"
            >
              {isUploading ? "Enviando..." : "Enviar arquivo"}
            </button>
          </div>

          <div
            id="registro-venda"
            className="rounded-2xl border border-white/[0.08] bg-[#191919] p-4"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d6ff00]">
              Entrada manual
            </p>

            <h2 className="mb-3 mt-1 text-sm font-semibold">
              Registrar movimento
            </h2>

            <SaleForm onSubmit={handleSaleSubmit} />
          </div>

        </section>

        {/* INTEGRAÇÕES */}
        <IntegrationsSection />

        {/* HISTÓRICO */}
        <ImportHistory />

      </div>
    </main>
  );
}