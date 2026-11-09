"use client";

import { useState } from "react";
import { AlertPanel } from "../components/AlertPanel";
import { ShiftGrid } from "../components/ShiftGrid";

const DAYS = [
  { label: "Seg 10", short: "Seg" },
  { label: "Ter 11", short: "Ter" },
  { label: "Qua 12", short: "Qua" },
  { label: "Qui 13", short: "Qui" },
  { label: "Sex 14", short: "Sex" },
  { label: "Sáb 15", short: "Sáb" },
  { label: "Dom 16", short: "Dom" },
];

export default function EquipePage() {
  const [selectedDay, setSelectedDay] = useState("Qua 12");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-8 lg:px-12">
      {/* Cabeçalho */}
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#D4FF00]">
          OTIMIZAÇÃO DE ESCALA
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Equipe
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Dimensione os turnos conforme o fluxo esperado e evite sobrecarga ou ociosidade.
        </p>
      </header>

      {/* Seletor de Dias com a barra de rolagem visível e estilizada exatamente abaixo */}
      <div className="mb-6">
        <div className="overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-900 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400">
          <div className="flex gap-2 w-max pb-1">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day.label;
              return (
                <button
                  key={day.label}
                  onClick={() => setSelectedDay(day.label)}
                  className={`flex-shrink-0 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-white text-black shadow-md"
                      : "border border-zinc-800 bg-[#121214] text-zinc-400 hover:text-white"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cards de Métricas do Dia (Expandidos para Desktop) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative rounded-2xl border border-zinc-800 bg-[#121214] p-5">
          <div className="absolute right-4 top-4 rounded-full bg-[#D4FF00]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#D4FF00]">
            IDEAL
          </div>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-[#D4FF00] font-bold text-xs">
            👥
          </div>
          <p className="text-xs text-zinc-400">Equipe necessária</p>
          <p className="text-2xl font-bold text-white">5 pessoas</p>
          <p className="text-[11px] text-zinc-500">para {selectedDay}</p>
        </div>

        <div className="relative rounded-2xl border border-zinc-800 bg-[#121214] p-5">
          <div className="absolute right-4 top-4 rounded-full bg-[#D4FF00]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#D4FF00]">
            +32%
          </div>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-[#D4FF00] font-bold text-xs">
            ⏰
          </div>
          <p className="text-xs text-zinc-400">Turno crítico</p>
          <p className="text-2xl font-bold text-white">17h–21h</p>
          <p className="text-[11px] text-zinc-500">maior movimento</p>
        </div>

        <div className="relative rounded-2xl border border-zinc-800 bg-[#121214] p-5">
          <div className="absolute right-4 top-4 rounded-full bg-[#D4FF00]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#D4FF00]">
            +6%
          </div>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-[#D4FF00] font-bold text-xs">
            💰
          </div>
          <p className="text-xs text-zinc-400">Economia estimada</p>
          <p className="text-2xl font-bold text-white">R$ 420</p>
          <p className="text-[11px] text-zinc-500">com a escala sugerida</p>
        </div>
      </div>

      {/* Cobertura por turnos e Alerta da IA */}
      <div className="space-y-6">
        <ShiftGrid />
        <AlertPanel />
      </div>
    </main>
  );
}