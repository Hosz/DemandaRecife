"use client";

import React, { useMemo, useState } from "react";

type Campanha = {
  id: string;
  status: "Ativa" | "Agendada";
  data: string;
  titulo: string;
  detalhe: string;
};

export default function PromocoesPage() {
  // Estados do Simulador de Desconto
  const [precoAtual, setPrecoAtual] = useState<string>("8.5");
  const [custoUnitario, setCustoUnitario] = useState<string>("5.2");
  const [desconto, setDesconto] = useState<number>(18);

  // Lista de Campanhas Ativas e Programadas
  const campanhas: Campanha[] = [
    {
      id: "1",
      status: "Ativa",
      data: "12-14 jun",
      titulo: "Arraiá da Padaria",
      detalhe: "+R$ 840 previsto",
    },
    {
      id: "2",
      status: "Ativa",
      data: "Toda sexta",
      titulo: "Combo do café",
      detalhe: "+18% no ticket",
    },
    {
      id: "3",
      status: "Agendada",
      data: "23-24 jun",
      titulo: "São João",
      detalhe: "R$ 2.300 previsto",
    },
  ];

  // Cálculos reativos do simulador
  const { precoPromocional, margemFinal, descontoMaximo } = useMemo(() => {
    const preco = parseFloat(precoAtual.replace(",", ".")) || 0;
    const custo = parseFloat(custoUnitario.replace(",", ".")) || 0;

    const promo = preco * (1 - desconto / 100);
    const margem = promo > 0 ? ((promo - custo) / promo) * 100 : 0;
    const descMax = preco > 0 && preco > custo ? ((preco - custo) / preco) * 100 : 0;

    return {
      precoPromocional: promo > 0 ? promo.toFixed(2) : "0,00",
      margemFinal: margem.toFixed(1),
      descontoMaximo: Math.max(0, Math.floor(descMax)),
    };
  }, [precoAtual, custoUnitario, desconto]);

  const aplicarSugestao = () => {
    setDesconto(18);
  };

  const handleSalvarSimulacao = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      precoAtual,
      custoUnitario,
      desconto,
      precoPromocional,
      margemFinal,
    });
  };

  return (
    <div className="min-h-screen bg-[#111214] text-white">
      {/* Topbar / Subheader */}
      <header className="border-b border-white/[0.06] px-4 py-3 sm:px-8 flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#8e8f94] uppercase">
          Campanhas e Precificação
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
        {/* Cabeçalho com Título e Botão Nova Campanha */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
              Margem Protegida
            </span>
            <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Promoções
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#8e8f94] max-w-2xl leading-relaxed">
              Simule descontos, liquide itens parados e crie campanhas sem comprometer a rentabilidade.
            </p>
          </div>

          <button
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#d6ff00] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#111214] transition hover:brightness-105 active:scale-[0.99]"
          >
            <span className="text-base leading-none font-bold">+</span>
            Nova campanha
          </button>
        </div>

        {/* Linha Superior: Simulador (Esquerda) + Sugestão Inteligente (Direita) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch mb-6">
          
          {/* Card: Simulador de Desconto */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="h-full rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-7 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                  Simulador de Desconto
                </span>
                <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                  Calcule antes de publicar
                </h2>

                <form onSubmit={handleSalvarSimulacao} className="mt-6 space-y-6">
                  {/* Inputs de Preço e Custo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#8e8f94] mb-2">
                        Preço atual
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-xs font-semibold text-[#8e8f94]">
                          R$
                        </span>
                        <input
                          type="text"
                          value={precoAtual}
                          onChange={(e) => setPrecoAtual(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#d6ff00] focus:outline-none focus:ring-1 focus:ring-[#d6ff00]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#8e8f94] mb-2">
                        Custo unitário
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-xs font-semibold text-[#8e8f94]">
                          R$
                        </span>
                        <input
                          type="text"
                          value={custoUnitario}
                          onChange={(e) => setCustoUnitario(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.07] bg-[#1f2024] pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#d6ff00] focus:outline-none focus:ring-1 focus:ring-[#d6ff00]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slider de Desconto */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-[#8e8f94]">
                        Desconto: <strong className="text-white">{desconto}%</strong>
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={desconto}
                        onChange={(e) => setDesconto(Number(e.target.value))}
                        className="w-full h-2 bg-[#282a2f] rounded-lg appearance-none cursor-pointer accent-[#d6ff00]"
                        style={{
                          background: `linear-gradient(to right, #d6ff00 ${desconto}%, #282a2f ${desconto}%)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Mini Cards de Resultados */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/[0.05] bg-[#1f2024] p-4">
                      <p className="text-[11px] text-[#8e8f94]">Preço promocional</p>
                      <p className="mt-1 text-base sm:text-lg font-bold text-white">
                        R$ {precoPromocional.replace(".", ",")}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.05] bg-[#1f2024] p-4">
                      <p className="text-[11px] text-[#8e8f94]">Margem final</p>
                      <p
                        className={`mt-1 text-base sm:text-lg font-bold ${
                          Number(margemFinal) <= 0 ? "text-red-400" : "text-[#d6ff00]"
                        }`}
                      >
                        {margemFinal}%
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.05] bg-[#1f2024] p-4">
                      <p className="text-[11px] text-[#8e8f94]">Desconto máximo</p>
                      <p className="mt-1 text-base sm:text-lg font-bold text-white">
                        {descontoMaximo}%
                      </p>
                    </div>
                  </div>

                  {/* Botão Salvar Simulação */}
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#d6ff00] text-[#111214] font-bold text-sm tracking-wide transition hover:brightness-105 active:scale-[0.99] flex items-center justify-center"
                  >
                    Salvar simulação
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Card: Sugestão Inteligente */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="h-full rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-7 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
                  Sugestão Inteligente
                </span>
                <h2 className="mt-1 text-lg sm:text-xl font-bold text-white leading-snug">
                  Iogurtes próximos do vencimento
                </h2>

                <div className="mt-6 flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-[#8e8f94]">12 unidades em risco</p>
                    <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-white">
                      18% OFF
                    </p>
                  </div>
                  <span className="rounded-full bg-[#d6ff00]/10 border border-[#d6ff00]/20 px-2.5 py-1 text-[10px] font-bold text-[#d6ff00]">
                    Margem +12%
                  </span>
                </div>

                <p className="mt-6 text-xs sm:text-sm text-[#8e8f94] leading-relaxed">
                  Com esta oferta, a chance de vender todo o lote sobe para 84%, evitando uma perda estimada de R$ 62,40.
                </p>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={aplicarSugestao}
                  className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs sm:text-sm font-semibold transition hover:bg-white/10 active:scale-[0.99]"
                >
                  Aplicar sugestão
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Linha Inferior: Campanhas Ativas e Programadas */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#16171a] p-5 sm:p-7 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d6ff00]">
            Campanhas
          </span>
          <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
            Ativas e programadas
          </h2>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campanhas.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/[0.07] bg-[#1f2024] p-4 flex flex-col justify-between hover:border-white/20 transition-all duration-150"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      item.status === "Ativa"
                        ? "bg-[#d6ff00]/15 text-[#d6ff00] border border-[#d6ff00]/30"
                        : "bg-white/10 text-[#8e8f94] border border-white/10"
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[10px] text-[#8e8f94]">{item.data}</span>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-bold text-white">{item.titulo}</h3>
                  <p className="mt-1 text-xs text-[#8e8f94]">{item.detalhe}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}