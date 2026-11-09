"use client";

import { useEffect, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { SaleForm, type SaleFormData, type Product } from "../components/SaleForm";
import { useToast } from "../components/ToastProvider";
import {
  createSale,
  uploadSalesFile,
  fetchProducts,
  fetchBenchmarkSuggestions,
  addStarterKit,
  getTenantSettings,
  type BenchmarkSuggestion,
} from "../lib/api";
import { getTenantId } from "../lib/auth";
import { IntegrationsSection } from "../components/IntegrationsSection";
import { ImportHistory } from "../components/ImportHistory";

const DEFAULT_SUGGESTED_PRODUCTS: Product[] = [
  { id: "1", name: "Leite integral" },
  { id: "2", name: "Iogurte natural" },
  { id: "3", name: "Farinha de trigo" },
  { id: "4", name: "Café em grãos" },
  { id: "5", name: "Refrigerante lata" },
];

export default function DadosPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>(DEFAULT_SUGGESTED_PRODUCTS);
  const [suggestions, setSuggestions] = useState<BenchmarkSuggestion[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingStarterKit, setIsAddingStarterKit] = useState(false);

  useEffect(() => {
    async function loadData() {
      const id = getTenantId();
      let tenantNicho: string | undefined;
      if (id) {
        const settings = await getTenantSettings(id);
        if (settings?.nichoAtuacao) {
          tenantNicho = settings.nichoAtuacao;
        }
      }

      const [list, benchSuggestions] = await Promise.all([
        fetchProducts(),
        fetchBenchmarkSuggestions(tenantNicho),
      ]);
      if (list && list.length > 0) {
        setProducts(list.map((p) => ({ id: p.id, name: p.nome })));
      }
      setSuggestions(benchSuggestions || []);
    }
    void loadData();
  }, []);

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
    if (result.ok) {
      const list = await fetchProducts();
      if (list && list.length > 0) {
        setProducts(list.map((p) => ({ id: p.id, name: p.nome })));
      }
    }
    return result.ok;
  }

  async function handleApplyStarterKit() {
    setIsAddingStarterKit(true);
    const id = getTenantId();
    let tenantNicho: string | undefined;
    if (id) {
      const settings = await getTenantSettings(id);
      if (settings?.nichoAtuacao) {
        tenantNicho = settings.nichoAtuacao;
      }
    }
    const updated = await addStarterKit(undefined, tenantNicho);
    setIsAddingStarterKit(false);

    if (updated && updated.length > 0) {
      setProducts(updated.map((p) => ({ id: p.id, name: p.nome })));
      showToast("success", "Produtos de referência adicionados ao seu catálogo com sucesso!");
    } else {
      showToast("error", "Não foi possível adicionar os produtos sugeridos.");
    }
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

      {/* Banner de Benchmarks / Sugestão de Catálogo (RF07 Cold Start) */}
      {suggestions.length > 0 && (
        <section className="panel mb-6 border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 via-background to-background p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                  ⚡ Cold Start • Base Recife
                </span>
                <h3 className="text-sm font-semibold text-white">Catálogo de Referência do seu Segmento</h3>
              </div>
              <p className="mt-1 text-xs text-muted">
                Adicione com 1 clique os produtos de maior giro do seu setor no Grande Recife para iniciar seu catálogo e alimentar previsões imediatas.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    <span>{s.nomeSugerido}</span>
                    <span className="text-[10px] text-muted font-normal">
                      (~{s.mediaDiaria} {s.unidade || "un"}/dia)
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={isAddingStarterKit}
              onClick={handleApplyStarterKit}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
            >
              {isAddingStarterKit ? "Adicionando..." : "Adicionar itens sugeridos"}
            </button>
          </div>
        </section>
      )}

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

          <SaleForm products={products} onSubmit={handleSaleSubmit} />
        </section>

        <IntegrationsSection />
        
        <ImportHistory />
      </div>
    </main>
  );
}
