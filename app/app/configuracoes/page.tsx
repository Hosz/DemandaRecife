"use client";

import React, { useState } from "react";

type Segment = "Padaria" | "Salão" | "Restaurante" | "Oficina";

export default function ConfiguracoesPage() {
  const [segmento, setSegmento] = useState<Segment>("Padaria");
  const [abertura, setAbertura] = useState("06:00");
  const [fechamento, setFechamento] = useState("21:00");
  const [ticketMedio, setTicketMedio] = useState("R$ 18,50");
  const [cidade, setCidade] = useState("Recife, PE");
  const [usarBenchmarks, setUsarBenchmarks] = useState(true);

  const segmentos: Segment[] = ["Padaria", "Salão", "Restaurante", "Oficina"];

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para salvar as alterações via API
    console.log({
      segmento,
      abertura,
      fechamento,
      ticketMedio,
      cidade,
      usarBenchmarks,
    });
  };

  return (
    <div className="min-h-screen bg-[#111214] text-white">
      {/* Topbar / Subheader (Visível em Mobile e Desktop) */}
      <header className="border-b border-white/[0.06] px-4 py-3 sm:px-8 flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#8e8f94] uppercase">
          Perfil e Parâmetros
        </span>
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-[#8e8f94] border border-white/10"
            aria-label="Notificações"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
        </div>
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
            Ajuste o perfil usado para calibrar benchmarks, previsões e recomendações.
          </p>
        </div>

        {/* Layout Grid: Coluna Principal (Form) + Coluna Lateral (Cards Informativos) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          
          {/* Coluna Esquerda: Formulário de Perfil da Empresa (Ocupa 7 ou 8 cols no desktop) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-7 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                Perfil da Empresa
              </span>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                Minha Padaria
              </h2>

              <form onSubmit={handleSalvar} className="mt-6 space-y-5 sm:space-y-6">
                {/* Segmento de atuação */}
                <div>
                  <label className="block text-xs font-medium text-[#8e8f94] mb-2.5">
                    Segmento de atuação
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {segmentos.map((item) => {
                      const isActive = segmento === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSegmento(item)}
                          className={`w-full py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 border ${
                            isActive
                              ? "bg-[#d6ff00] text-[#111214] border-[#d6ff00] shadow-sm font-bold"
                              : "bg-[#1f2024] text-white/80 border-white/[0.05] hover:bg-[#282a2f] hover:text-white"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Horários (Abertura e Fechamento) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Abertura */}
                  <div>
                    <label className="block text-xs font-medium text-[#8e8f94] mb-2">
                      Abertura
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={abertura}
                        onChange={(e) => setAbertura(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#d6ff00] focus:outline-none focus:ring-1 focus:ring-[#d6ff00]"
                      />
                      <svg
                        className="absolute right-3.5 h-4 w-4 text-[#8e8f94] pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Fechamento */}
                  <div>
                    <label className="block text-xs font-medium text-[#8e8f94] mb-2">
                      Fechamento
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={fechamento}
                        onChange={(e) => setFechamento(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#d6ff00] focus:outline-none focus:ring-1 focus:ring-[#d6ff00]"
                      />
                      <svg
                        className="absolute right-3.5 h-4 w-4 text-[#8e8f94] pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Ticket Médio e Cidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ticket Médio */}
                  <div>
                    <label className="block text-xs font-medium text-[#8e8f94] mb-2">
                      Ticket médio
                    </label>
                    <input
                      type="text"
                      value={ticketMedio}
                      onChange={(e) => setTicketMedio(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#d6ff00] focus:outline-none focus:ring-1 focus:ring-[#d6ff00]"
                    />
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="block text-xs font-medium text-[#8e8f94] mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#d6ff00] focus:outline-none focus:ring-1 focus:ring-[#d6ff00]"
                    />
                  </div>
                </div>

                {/* Card Checkbox: Usar benchmarks do segmento */}
                <div
                  onClick={() => setUsarBenchmarks(!usarBenchmarks)}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/[0.07] bg-[#1f2024] cursor-pointer hover:bg-[#25272c] transition"
                >
                  <div className="pr-4">
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      Usar benchmarks do segmento
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#8e8f94] mt-0.5">
                      Melhora estimativas quando ainda existem poucos dados.
                    </p>
                  </div>
                  
                  {/* Custom Checkbox */}
                  <div
                    className={`h-5 w-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      usarBenchmarks ? "bg-[#d6ff00] text-black" : "border border-white/20 bg-transparent"
                    }`}
                  >
                    {usarBenchmarks && (
                      <svg
                        className="w-3.5 h-3.5 stroke-[3]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Botão Salvar Alterações */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#d6ff00] text-[#111214] font-bold text-sm tracking-wide transition hover:brightness-105 active:scale-[0.99] flex items-center justify-center"
                >
                  Salvar alterações
                </button>
              </form>
            </div>
          </div>

          {/* Coluna Direita: Cards Informativos (Ocupa 5 ou 4 cols no desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            
            {/* Card 1: Qualidade do Setup */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-6 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                Qualidade do Setup
              </span>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                Perfil 92% completo
              </h2>

              {/* Barra de Progresso */}
              <div className="mt-4 h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#d6ff00]"
                  style={{ width: "92%" }}
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
                  <span>Segmento definido</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6ff00] text-black">
                    <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Horários cadastrados</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6ff00] text-black">
                    <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Ticket médio informado</span>
                </li>

                <li className="flex items-center gap-3 text-[#8e8f94]">
                  <div className="h-5 w-5 shrink-0 rounded-full border border-white/20" />
                  <span>Conectar uma adquirente</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Cold Start / Benchmark Ativo */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-6 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                Cold Start
              </span>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                Benchmark ativo
              </h2>

              <p className="mt-3 text-xs sm:text-sm text-[#8e8f94] leading-relaxed">
                Enquanto seu histórico cresce, as previsões usam dados médios de 184 padarias com perfil semelhante.
              </p>

              <div className="mt-6 flex items-end justify-between border-t border-white/[0.06] pt-4">
                <div>
                  <p className="text-[11px] text-[#8e8f94]">Confiança inicial</p>
                  <p className="mt-0.5 text-2xl sm:text-3xl font-extrabold text-white">78%</p>
                </div>
                {/* Ícone de Brilho / Estrelas */}
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

      {/* Botão flutuante de ajuda (?) no canto inferior direito */}
      <aside aria-label="Ajuda e suporte">
        <button
          type="button"
          className="fixed bottom-4 right-4 z-40 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1f2024] border border-white/10 text-white/70 hover:text-white shadow-lg transition"
          aria-label="Ajuda"
        >
          <span className="text-sm font-semibold">?</span>
        </button>
      </aside>
    </div>
  );
}