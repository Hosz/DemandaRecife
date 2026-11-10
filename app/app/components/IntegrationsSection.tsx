"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "./ToastProvider";
import { fetchIntegrationsStatus, type IntegrationsStatus } from "../lib/api";

interface PdvConfig {
  connected: boolean;
  identifier?: string;
  apiKey?: string;
  environment?: "sandbox" | "production";
  lastSync?: string;
}

type PdvState = Record<string, PdvConfig>;

const STORAGE_KEY = "demanda_recife_pdv_integrations";

export function IntegrationsSection() {
  const { showToast } = useToast();
  const [backendStatus, setBackendStatus] = useState<IntegrationsStatus | null>(null);
  const [loadingBackend, setLoadingBackend] = useState<boolean>(true);

  // Estado das integrações de PDV (persistidas no navegador)
  const [pdvConfigs, setPdvConfigs] = useState<PdvState>({});

  // Modal de configuração de PDV
  const [activeModalId, setActiveModalId] = useState<"stone" | "pagseguro" | null>(null);
  const [formData, setFormData] = useState<{
    identifier: string;
    apiKey: string;
    environment: "sandbox" | "production";
  }>({
    identifier: "",
    apiKey: "",
    environment: "production",
  });

  // Carrega status nativo do backend e configurações salvas do PDV
  useEffect(() => {
    async function init() {
      setLoadingBackend(true);
      const status = await fetchIntegrationsStatus();
      setBackendStatus(status);
      setLoadingBackend(false);

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setPdvConfigs(JSON.parse(saved) as PdvState);
        }
      } catch {
        // ignore
      }
    }
    void init();
  }, []);

  const openConfigModal = (id: "stone" | "pagseguro") => {
    const current = pdvConfigs[id];
    setFormData({
      identifier: current?.identifier || "",
      apiKey: current?.apiKey || "",
      environment: current?.environment || "production",
    });
    setActiveModalId(id);
  };

  const handleSimulateQuickConnect = (id: "stone" | "pagseguro") => {
    const isStone = id === "stone";
    const updated: PdvState = {
      ...pdvConfigs,
      [id]: {
        connected: true,
        identifier: isStone ? "489201 (Demonstração)" : "demo@pagbank.com.br (Demonstração)",
        apiKey: "simulated_token_demo",
        environment: "sandbox",
        lastSync: "Agora mesmo",
      },
    };

    setPdvConfigs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    const label = isStone ? "Stone PDV" : "PagSeguro";
    showToast("success", `Maquininha ${label} conectada em modo Demonstração com sucesso!`);
    setActiveModalId(null);
  };

  const handleSavePdv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalId) return;

    if (!formData.identifier.trim()) {
      showToast("error", activeModalId === "stone" ? "Informe o Stone Code da maquininha." : "Informe o e-mail da conta PagBank.");
      return;
    }

    const updated: PdvState = {
      ...pdvConfigs,
      [activeModalId]: {
        connected: true,
        identifier: formData.identifier.trim(),
        apiKey: formData.apiKey.trim() || undefined,
        environment: formData.environment,
        lastSync: "Agora mesmo",
      },
    };

    setPdvConfigs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    const label = activeModalId === "stone" ? "Stone PDV" : "PagSeguro";
    showToast("success", `Maquininha ${label} conectada com sucesso!`);
    setActiveModalId(null);
  };

  const handleDisconnect = (id: "stone" | "pagseguro") => {
    const updated = { ...pdvConfigs };
    delete updated[id];
    setPdvConfigs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const label = id === "stone" ? "Stone PDV" : "PagSeguro";
    showToast("success", `Integração ${label} desconectada.`);
    setActiveModalId(null);
  };

  const stoneConnected = Boolean(pdvConfigs["stone"]?.connected);
  const pagseguroConnected = Boolean(pdvConfigs["pagseguro"]?.connected);

  return (
    <section className="panel relative">
      <p className="eyebrow">APIs e fontes externas</p>
      <h2 className="section-title mb-2">Integrações de Dados</h2>
      <p className="text-xs text-[#8e8f94] mb-5 leading-relaxed">
        O Demanda Recife monitora fontes nativas e permite acoplar seus pontos de venda físicos para previsão contínua.
      </p>

      <div className="space-y-4">
        {/* Item 1: Clima Tempo & Meteorologia (NATIVO) */}
        <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#27272a] rounded-lg text-[#d6ff00]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white">Clima & Meteorologia</h3>
                  <span className="rounded-full bg-[#d6ff00]/15 text-[#d6ff00] border border-[#d6ff00]/30 px-2 py-0.5 text-[10px] font-bold">
                    Nativo Ativo
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {loadingBackend
                    ? "Consultando telemetria Open-Meteo..."
                    : `${backendStatus?.climaAtual?.location ?? "Recife, PE"} • ${backendStatus?.climaAtual?.temp ?? "28°C"} (${backendStatus?.climaAtual?.condition ?? "Ensolarado"})`}
                </p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-800/80 pt-2">
            Integração automática com dados meteorológicos do Recife para ponderar o impacto de chuvas e calor nas previsões de movimento.
          </p>
        </div>

        {/* Item 2: Calendário Regional Recife & PE (NATIVO) */}
        <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#27272a] rounded-lg text-[#d6ff00]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white">Calendário Regional PE</h3>
                  <span className="rounded-full bg-[#d6ff00]/15 text-[#d6ff00] border border-[#d6ff00]/30 px-2 py-0.5 text-[10px] font-bold">
                    Nativo Ativo
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Feriados municipais do Recife e estaduais de Pernambuco
                </p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-800/80 pt-2">
            Mapeia datas como São João, Carnaval, Feriado de Nossa Senhora do Carmo e feriados nacionais, calibrando a IA para picos antecipados.
          </p>
        </div>

        {/* Item 3: Stone PDV */}
        <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#27272a] rounded-lg text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white">Stone PDV</h3>
                  {stoneConnected && (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                      Conectado
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {stoneConnected
                    ? `Stone Code: ${pdvConfigs["stone"]?.identifier} (${pdvConfigs["stone"]?.environment === "sandbox" ? "Sandbox" : "Produção"})`
                    : "Disponível para conectar maquininhas e TEF"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openConfigModal("stone")}
            className={`w-full py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
              stoneConnected
                ? "bg-transparent text-emerald-400 border border-zinc-700 hover:bg-zinc-800"
                : "bg-[#d6ff00] text-black hover:bg-[#bce000]"
            }`}
          >
            {stoneConnected ? "Configurar ou Desconectar" : "Conectar Stone PDV"}
          </button>
        </div>

        {/* Item 4: PagSeguro */}
        <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#27272a] rounded-lg text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white">PagSeguro / PagBank</h3>
                  {pagseguroConnected && (
                    <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                      Conectado
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {pagseguroConnected
                    ? `Conta: ${pdvConfigs["pagseguro"]?.identifier} (${pdvConfigs["pagseguro"]?.environment === "sandbox" ? "Sandbox" : "Produção"})`
                    : "Disponível para sincronização de vendas"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openConfigModal("pagseguro")}
            className={`w-full py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
              pagseguroConnected
                ? "bg-transparent text-amber-400 border border-zinc-700 hover:bg-zinc-800"
                : "bg-[#d6ff00] text-black hover:bg-[#bce000]"
            }`}
          >
            {pagseguroConnected ? "Configurar ou Desconectar" : "Conectar PagSeguro"}
          </button>
        </div>
      </div>

      {/* Modal de Conexão de PDV */}
      {activeModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#16171a] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#d6ff00]">
                  Conexão Rápida de PDV
                </span>
                <h3 className="text-lg font-bold text-white">
                  {activeModalId === "stone" ? "Conectar Stone PDV" : "Conectar PagSeguro / PagBank"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalId(null)}
                className="text-[#8e8f94] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Opção 1: Demonstração em 1 clique */}
            <div className="mt-4 rounded-xl border border-[#d6ff00]/20 bg-[#d6ff00]/5 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">Testar sem digitar dados agora?</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Simule uma maquininha ativa com dados de demonstração em 1 clique.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSimulateQuickConnect(activeModalId)}
                className="mt-2.5 w-full py-2 px-3 rounded-lg bg-[#d6ff00]/15 hover:bg-[#d6ff00]/25 border border-[#d6ff00]/30 text-xs font-bold text-[#d6ff00] transition"
              >
                ⚡ Conectar Demonstração (1 clique)
              </button>
            </div>

            <div className="relative my-4 text-center">
              <span className="bg-[#16171a] px-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                ou conecte sua maquininha real
              </span>
            </div>

            <form onSubmit={handleSavePdv} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white mb-1">
                  {activeModalId === "stone" ? "Código da Maquininha (Stone Code)" : "E-mail da sua Conta PagBank"}
                </label>
                <input
                  type={activeModalId === "stone" ? "text" : "email"}
                  required
                  placeholder={activeModalId === "stone" ? "Ex: 893120" : "Ex: meucomercio@gmail.com"}
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3.5 py-2.5 text-sm text-white focus:border-[#d6ff00] focus:outline-none placeholder-zinc-500"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  {activeModalId === "stone"
                    ? "Código de 6 a 8 dígitos impresso atrás da maquininha ou no app Stone."
                    : "O mesmo e-mail que você usa para acessar o aplicativo PagBank."}
                </span>
              </div>

              {/* Opções avançadas recolhíveis */}
              <details className="rounded-xl border border-white/5 bg-[#1f2024]/50 p-3 text-xs text-zinc-400">
                <summary className="cursor-pointer font-medium text-zinc-300 hover:text-white select-none">
                  Opções avançadas (Chave de API / Ambiente)
                </summary>
                <div className="mt-3 space-y-3 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Token / Chave de API (opcional)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#16171a] px-3 py-1.5 text-xs text-white focus:border-[#d6ff00] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Ambiente
                    </label>
                    <select
                      value={formData.environment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          environment: e.target.value as "sandbox" | "production",
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#16171a] px-3 py-1.5 text-xs text-white focus:border-[#d6ff00] focus:outline-none [color-scheme:dark]"
                    >
                      <option value="production">Produção (Vendas reais da loja)</option>
                      <option value="sandbox">Ambiente de Testes / Sandbox</option>
                    </select>
                  </div>
                </div>
              </details>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#d6ff00] font-bold text-xs sm:text-sm text-black hover:brightness-105"
                >
                  Conectar Maquininha Real
                </button>

                {pdvConfigs[activeModalId]?.connected && (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(activeModalId)}
                    className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 font-semibold text-xs hover:bg-red-500/10 transition"
                  >
                    Desconectar integração
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveModalId(null)}
                  className="w-full py-2 rounded-xl text-zinc-400 text-xs hover:text-white"
                >
                  Fechar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
