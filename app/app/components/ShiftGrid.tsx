"use client";

import { useState } from "react";

interface Turno {
  horario: string;
  demanda: string;
  tipoDemanda: "baixa" | "media" | "alta";
  funcionarios: string[];
  vagaPendente?: boolean;
}

const SHIFTS_DATA: Turno[] = [
  {
    horario: "06h–12h",
    demanda: "Demanda média",
    tipoDemanda: "media",
    funcionarios: ["Marina", "João"],
  },
  {
    horario: "12h–17h",
    demanda: "Demanda baixa",
    tipoDemanda: "baixa",
    funcionarios: ["João", "Carla"],
  },
  {
    horario: "17h–21h",
    demanda: "Demanda alta",
    tipoDemanda: "alta",
    funcionarios: ["Marina", "Carla"],
    vagaPendente: true,
  },
];

export function ShiftGrid() {
  const [shifts] = useState<Turno[]>(SHIFTS_DATA);

  return (
    <section className="space-y-4">
      <div className="mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#D4FF00]">
          ESCALA SUGERIDA · QUA 12
        </p>
        <h2 className="text-xl font-bold text-white">Cobertura por turno</h2>
      </div>

      <div className="space-y-3">
        {shifts.map((shift, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-zinc-800 bg-[#121214] p-4 transition-all"
          >
            <div className="mb-3">
              <h3 className="text-lg font-bold text-white">{shift.horario}</h3>
              <p
                className={`text-xs font-medium ${
                  shift.tipoDemanda === "alta"
                    ? "text-[#D4FF00]"
                    : "text-zinc-400"
                }`}
              >
                {shift.demanda}
              </p>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {shift.funcionarios.map((nome) => (
                <span
                  key={nome}
                  className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200"
                >
                  {nome}
                </span>
              ))}

              {shift.vagaPendente && (
                <span className="rounded-full border border-dashed border-[#D4FF00] px-3 py-1.5 text-xs font-semibold text-[#D4FF00]">
                  +1 vaga
                </span>
              )}
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 py-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <span></span>
              Editar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}