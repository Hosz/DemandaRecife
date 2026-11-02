"use client";

import { useState } from "react";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const SHIFTS = ["Manhã", "Tarde", "Noite"];
const STAFF = ["Ana", "Bruno", "Carla", "Diego"];

function slotKey(day: string, shift: string) {
  return `${day}-${shift}`;
}

export function ShiftGrid() {
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  function handleChange(key: string, staff: string) {
    setAllocations((prev) => ({ ...prev, [key]: staff }));
  }

  return (
    <section className="panel">
      <h2 className="section-title">Turnos da semana</h2>
      <p className="mt-1 text-sm text-muted">
                Escolha quem trabalha em cada turno.
      </p>

      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[52rem] grid-cols-[4.5rem_repeat(7,1fr)] gap-2">
          <div />
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted"
            >
              {day}
            </div>
          ))}

          {SHIFTS.map((shift) => (
            <div key={shift} className="contents">
              <div className="flex items-center text-xs font-semibold text-muted">
                {shift}
              </div>
              {DAYS.map((day) => {
                                const key = slotKey(day, shift);
                const value = allocations[key] ?? "";

                return (
                  <select
                    key={key}
                    value={value}
                    onChange={(event) => handleChange(key, event.target.value)}
                    aria-label={`Turno ${shift} de ${day}`}
                    className="field"
                  >
                    <option value="">Vazio</option>
                    {STAFF.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}