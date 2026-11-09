"use client";

import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { getTenantId, getUser } from "../lib/auth";
import {
  getTenantSettings,
  updateTenantSettings,
  type OnboardingData,
} from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { DashboardSkeleton } from "../components/DashboardSkeleton";

const RECIFE_BAIRROS = [
  "Boa Viagem",
  "Pina",
  "Setúbal",
  "Brasília Teimosa",
  "Imbiribeira",
  "Ipsep",
  "Ibura",
  "Recife Antigo",
  "Santo Antônio",
  "São José",
  "Boa Vista",
  "Soledade",
  "Graças",
  "Espinheiro",
  "Aflitos",
  "Derby",
  "Jaqueira",
  "Parnamirim",
  "Casa Forte",
  "Casa Amarela",
  "Tamarineira",
  "Encruzilhada",
  "Torre",
  "Madalena",
  "Prado",
  "Cordeiro",
  "Várzea",
  "Caxangá",
  "Iputinga",
  "Afogados",
  "San Martin",
  "Areias",
  "Barro",
  "Tejipió",
  "Outro",
];

import { SEGMENT_CATEGORIES, ALL_SEGMENT_OPTIONS } from "../lib/segments";

export default function ConfiguracoesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [segmento, setSegmento] = useState(ALL_SEGMENT_OPTIONS[0].value);
  const [customSegmento, setCustomSegmento] = useState("");
  const [bairro, setBairro] = useState("Boa Viagem");
  const [cidade, setCidade] = useState("Recife");
  const [estado, setEstado] = useState("PE");
  const [abertura, setAbertura] = useState("06:00");
  const [fechamento, setFechamento] = useState("21:00");
  const [ticketMedio, setTicketMedio] = useState("");
  const [usarBenchmarks, setUsarBenchmarks] = useState(true);

  useEffect(() => {
    async function loadData() {
      const id = getTenantId();
      if (!id) {
        setLoading(false);
        return;
      }
      setTenantId(id);

      const res = await getTenantSettings(id);
      if (res) {
        setBusinessName(res.nome || "");
        if (res.nichoAtuacao) {
          const match = ALL_SEGMENT_OPTIONS.find((s) => s.value.toLowerCase() === res.nichoAtuacao!.toLowerCase());
          if (match) {
            setSegmento(match.value);
            setCustomSegmento("");
          } else {
            const legacyMatch = ALL_SEGMENT_OPTIONS.find((s) =>
              s.value.toLowerCase().includes(res.nichoAtuacao!.toLowerCase()) ||
              res.nichoAtuacao!.toLowerCase().includes(s.value.toLowerCase())
            );
            if (legacyMatch) {
              setSegmento(legacyMatch.value);
              setCustomSegmento("");
            } else {
              setSegmento("Outro");
              setCustomSegmento(res.nichoAtuacao);
            }
          }
        }
        if (res.bairro) setBairro(res.bairro);
        if (res.cidade) setCidade(res.cidade);
        if (res.estado) setEstado(res.estado);
        if (res.perfil?.horarioAbertura) setAbertura(res.perfil.horarioAbertura.slice(0, 5));
        if (res.perfil?.horarioFechamento) setFechamento(res.perfil.horarioFechamento.slice(0, 5));
        if (res.perfil?.usarBenchmarksColdStart !== undefined) {
          setUsarBenchmarks(Boolean(res.perfil.usarBenchmarksColdStart));
        }
        if (res.ticketMedio !== undefined && res.ticketMedio !== null) {
          setTicketMedio(String(res.ticketMedio));
        }
      } else {
        const u = getUser();
        if (u?.nome) setBusinessName(u.nome);
      }
      setLoading(false);
    }

    void loadData();
  }, []);

  // Calcula % do setup completado
  const setupPercent = useMemo(() => {
    let score = 25; // Base por ter conta
    if (segmento) score += 25;
    if (abertura && fechamento) score += 25;
    if (ticketMedio && Number(ticketMedio) > 0) score += 25;
    return score;
  }, [segmento, abertura, fechamento, ticketMedio]);

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      showToast("error", "Tenant não identificado. Faça login novamente.");
      return;
    }

    setSaving(true);

    let parsedTicket: number | null = null;
    if (ticketMedio.trim() !== "") {
      const num = parseFloat(ticketMedio.replace(",", "."));
      if (!Number.isNaN(num) && num >= 0) {
        parsedTicket = num;
      }
    }

    const finalNiche = segmento === "Outro" && customSegmento.trim() ? customSegmento.trim() : segmento;

    const payload: Partial<OnboardingData> = {
      businessName: businessName.trim() || undefined,
      niche: finalNiche,
      bairro,
      cidade,
      estado,
      openingTime: abertura ? `${abertura}:00` : undefined,
      closingTime: fechamento ? `${fechamento}:00` : undefined,
      averageTicket: parsedTicket,
      usarBenchmarksColdStart: usarBenchmarks,
    };

    const res = await updateTenantSettings(tenantId, payload);
    setSaving(false);

    if (res.ok) {
      showToast("success", "Configurações salvas com sucesso!");
    } else {
      showToast("error", res.message || "Erro ao salvar configurações.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111214] text-white">
      {/* Topbar / Subheader */}
      <header className="border-b border-white/[0.06] px-4 py-3 sm:px-8 flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#8e8f94] uppercase">
          Perfil e Parâmetros
        </span>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        {/* Título e Descrição */}
        <div className="mb-6 sm:mb-8">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
            Setup do Negócio
          </span>
          <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Configurações
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#8e8f94] max-w-2xl leading-relaxed">
            Ajuste o perfil da sua empresa usado para calibrar os modelos preditivos e recomendações.
          </p>
        </div>

        {/* Layout Grid: Form Principal + Sidebar com Status */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Coluna Esquerda: Formulário de Perfil da Empresa */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-7 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                Perfil da Empresa
              </span>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                {businessName || "Minha Empresa"}
              </h2>

              <form onSubmit={handleSalvar} className="mt-6 space-y-5 sm:space-y-6">
                {/* Nome do Negócio */}
                <div>
                  <label htmlFor="input-empresa" className="block text-xs font-medium text-[#8e8f94] mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    id="input-empresa"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Nome do seu comércio"
                    className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#d6ff00] focus:outline-none transition"
                  />
                </div>

                {/* Segmento de atuação */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-[#8e8f94]">
                      Segmento de atuação
                    </label>
                    <span className="text-[10px] text-muted">
                      Define os produtos e fluxo de Cold Start
                    </span>
                  </div>
                  <select
                    value={segmento}
                    onChange={(e) => setSegmento(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-4 py-3 text-sm text-white focus:border-[#d6ff00] focus:outline-none"
                  >
                    {SEGMENT_CATEGORIES.map((cat) => (
                      <optgroup key={cat.category} label={`${cat.icon} ${cat.category}`}>
                        {cat.options.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {segmento === "Outro" && (
                    <div className="mt-3">
                      <label className="block text-[11px] text-[#d6ff00] mb-1 font-semibold">
                        Especifique o segmento do seu negócio
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        placeholder="Ex: Farmácia, Pet Shop, Floricultura, Papelaria"
                        value={customSegmento}
                        onChange={(e) => setCustomSegmento(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-4 py-2.5 text-sm text-white focus:border-[#d6ff00] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Horário de funcionamento */}
                <div>
                  <label className="block text-xs font-medium text-[#8e8f94] mb-2">
                    Horário de funcionamento
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <span className="block text-[11px] text-[#8e8f94] mb-1">Abertura</span>
                      <input
                        type="time"
                        value={abertura}
                        onChange={(e) => setAbertura(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-white focus:border-[#d6ff00] focus:outline-none transition [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8e8f94] mb-1">Fechamento</span>
                      <input
                        type="time"
                        value={fechamento}
                        onChange={(e) => setFechamento(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-white focus:border-[#d6ff00] focus:outline-none transition [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Ticket Médio e Bairro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ticket médio estimado */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="input-ticket" className="text-xs font-medium text-[#8e8f94]">
                        Ticket médio estimado
                      </label>
                      <span className="text-[10px] text-[#8e8f94]">Opcional</span>
                    </div>
                    <input
                      id="input-ticket"
                      type="number"
                      step="0.01"
                      min="0"
                      value={ticketMedio}
                      onChange={(e) => setTicketMedio(e.target.value)}
                      placeholder="Ex: 35.00"
                      className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#d6ff00] focus:outline-none transition"
                    />
                  </div>

                  {/* Bairro no Recife */}
                  <div>
                    <label htmlFor="select-bairro" className="block text-xs font-medium text-[#8e8f94] mb-2">
                      Bairro no Recife
                    </label>
                    <select
                      id="select-bairro"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#1f2024] px-4 py-3 text-sm text-white focus:border-[#d6ff00] focus:outline-none transition [color-scheme:dark]"
                    >
                      {RECIFE_BAIRROS.map((b) => (
                        <option key={b} value={b} className="bg-[#1f2024] text-white">
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Checkbox / Toggle Benchmarks */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={usarBenchmarks}
                      onChange={(e) => setUsarBenchmarks(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-[#1f2024] text-[#d6ff00] focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-xs sm:text-sm text-[#8e8f94]">
                      Usar dados da vizinhança e nicho como benchmark inicial (Cold Start)
                    </span>
                  </label>
                </div>

                {/* Botão de Ação */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto min-w-[200px] py-3.5 px-6 rounded-xl bg-[#d6ff00] text-[#111214] font-bold text-sm tracking-wide transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  >
                    {saving ? "Salvando alterações..." : "Salvar configurações"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Coluna Direita: Cards Informativos e Cold Start */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Card 1: Qualidade do Setup */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-6 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                Qualidade do Setup
              </span>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                Perfil {setupPercent}% completo
              </h2>

              {/* Barra de Progresso */}
              <div className="mt-4 h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#d6ff00] transition-all duration-300"
                  style={{ width: `${setupPercent}%` }}
                />
              </div>

              {/* Checklist de Itens */}
              <ul className="mt-5 space-y-3.5 text-xs sm:text-sm text-white/90">
                <li className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6ff00] text-black">
                    <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Segmento definido ({segmento})</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6ff00] text-black">
                    <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Horários cadastrados ({abertura}–{fechamento})</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    ticketMedio && Number(ticketMedio) > 0
                      ? "bg-[#d6ff00] text-black"
                      : "border border-white/20 text-transparent"
                  }`}>
                    <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={ticketMedio && Number(ticketMedio) > 0 ? "" : "text-[#8e8f94]"}>
                    {ticketMedio && Number(ticketMedio) > 0
                      ? `Ticket médio informado (R$ ${ticketMedio})`
                      : "Ticket médio não informado"}
                  </span>
                </li>

                <li className="flex items-center gap-3 text-[#8e8f94]">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6ff00] text-black">
                    <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Localização: {bairro}, {cidade}</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Cold Start / Benchmark Ativo */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-6 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                Cold Start
              </span>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                Benchmark regional ativo
              </h2>

              <p className="mt-3 text-xs sm:text-sm text-[#8e8f94] leading-relaxed">
                As previsões iniciais são enriquecidas com a sazonalidade e dados médios de negócios em {bairro} e na Região Metropolitana do Recife.
              </p>

              <div className="mt-6 flex items-end justify-between border-t border-white/[0.06] pt-4">
                <div>
                  <p className="text-[11px] text-[#8e8f94]">Confiança inicial</p>
                  <p className="mt-0.5 text-2xl sm:text-3xl font-extrabold text-white">82%</p>
                </div>
                <div className="text-[#d6ff00] pb-1">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2h7.6l-6.15 4.5 2.35 7.3-6.2-4.55-6.2 4.55 2.35-7.3-6.15-4.5h7.6z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
