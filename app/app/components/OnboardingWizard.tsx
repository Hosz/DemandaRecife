"use client";

import React, { useState } from "react";

interface OnboardingWizardProps {
  onSubmit: (data: {
    niche: string;
    businessDays: string[];
    openingTime: string;
    closingTime: string;
    averageTicket: number;
  }) => Promise<boolean>;
}

const NICHES = [
  "Padaria / Confeitaria",
  "Salão de Beleza / Estética",
  "Autopeças / Oficina",
  "Mercado / Mercearia",
  "Restaurante / Bar",
  "Loja de Roupas / Vestuário",
  "Outro",
];

const DAYS_OF_WEEK = [
  { id: "SEG", label: "Seg" },
  { id: "TER", label: "Ter" },
  { id: "QUA", label: "Qua" },
  { id: "QUI", label: "Qui" },
  { id: "SEX", label: "Sex" },
  { id: "SAB", label: "Sáb" },
  { id: "DOM", label: "Dom" },
];

export function OnboardingWizard({ onSubmit }: OnboardingWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const [niche, setNiche] = useState<string>(NICHES[0]);
  const [businessDays, setBusinessDays] = useState<string[]>(["SEG", "TER", "QUA", "QUI", "SEX"]);
  const [openingTime, setOpeningTime] = useState<string>("08:00");
  const [closingTime, setClosingTime] = useState<string>("18:00");
  const [averageTicket, setAverageTicket] = useState<string>("");

  function toggleDay(dayId: string) {
    setBusinessDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  }

  async function handleFinish() {
    setLoading(true);
    await onSubmit({
      niche,
      businessDays,
      openingTime,
      closingTime,
      averageTicket: Number(averageTicket) || 0,
    });
    setLoading(false);
  }

  return (
    <div className="panel max-w-xl mx-auto space-y-6">
      {/* Indicador de Passos */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === i
                  ? "bg-lime-400 text-zinc-950"
                  : step > i
                  ? "bg-zinc-800 text-lime-400 border border-lime-400/30"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {i}
            </div>
            <span className="text-xs text-zinc-400 hidden sm:inline">
              {i === 1 ? "Nicho" : i === 2 ? "Horários" : "Ticket Médio"}
            </span>
          </div>
        ))}
      </div>

      {/* PASSO 1: NICHO DE ATUAÇÃO */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow">Passo 1 de 3</p>
            <h2 className="section-title">Qual é o seu nicho de atuação?</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Esta informação é essencial para calibrar as previsões iniciais (Cold Start).
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs text-zinc-400 font-medium">Selecione o segmento</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-lime-400"
            >
              {NICHES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="primary-button w-full mt-4"
          >
            Continuar
          </button>
        </div>
      )}

      {/* PASSO 2: HORÁRIOS E DIAS */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow">Passo 2 de 3</p>
            <h2 className="section-title">Horários de funcionamento</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Informe os dias e horários em que o seu estabelecimento está aberto.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs text-zinc-400 font-medium">Dias de funcionamento</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const active = businessDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? "bg-lime-400 text-zinc-950"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Abertura</label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-lime-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Fechamento</label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-lime-400"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-sm font-medium"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="primary-button w-2/3"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASSO 3: TICKET MÉDIO */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow">Passo 3 de 3</p>
            <h2 className="section-title">Ticket médio estimado</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Qual é o valor médio gasto por cada cliente em cada compra?
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs text-zinc-400 font-medium">Ticket Médio (R$)</label>
            <input
              type="number"
              placeholder="Ex: 45.00"
              value={averageTicket}
              onChange={(e) => setAverageTicket(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-lime-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-1/3 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-sm font-medium"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={loading || !averageTicket}
              onClick={handleFinish}
              className="primary-button w-2/3"
            >
              {loading ? "Concluindo..." : "Finalizar Onboarding"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}