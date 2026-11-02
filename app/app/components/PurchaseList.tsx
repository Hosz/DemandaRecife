"use client";

import { useState } from "react";

type Urgency = "hoje" | "amanha" | "semana";

type PurchaseItem = {
  id: number;
  product: string;
  quantity: string;
  deadline: string;
  when: Urgency;
};

const URGENCY_ORDER: Record<Urgency, number> = {
  hoje: 0,
  amanha: 1,
  semana: 2,
};

const WHEN_LABEL: Record<Urgency, string> = {
  hoje: "Urgente",
  amanha: "Atenção",
  semana: "Tranquilo",
};

const WHEN_STYLE: Record<Urgency, string> = {
  hoje: "bg-red-500/15 text-red-300",
  amanha: "bg-amber-500/15 text-amber-300",
  semana: "bg-acid/15 text-acid",
};

// Dados de exemplo. Depois trocar pela chamada à API (RF04 do back).
const ITEMS: PurchaseItem[] = [
  { id: 1, product: "Farinha de trigo", quantity: "25 kg", deadline: "Até hoje, 18h", when: "hoje" },
  { id: 2, product: "Ovos", quantity: "12 dúzias", deadline: "Até hoje, 18h", when: "hoje" },
  { id: 3, product: "Manteiga", quantity: "8 kg", deadline: "Até amanhã, 12h", when: "amanha" },
  { id: 4, product: "Açúcar", quantity: "20 kg", deadline: "Até sexta-feira", when: "semana" },
];

export function PurchaseList() {
  const [bought, setBought] = useState<Set<number>>(new Set());

  function toggleBought(id: number) {
    setBought((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Mais urgentes no topo; itens já comprados vão pro final.
  const sorted = [...ITEMS].sort((a, b) => {
    const doneDiff = Number(bought.has(a.id)) - Number(bought.has(b.id));
    if (doneDiff !== 0) return doneDiff;
    return URGENCY_ORDER[a.when] - URGENCY_ORDER[b.when];
  });

  return (
    <ul className="space-y-3">
      {sorted.map((item) => {
        const done = bought.has(item.id);

        return (
          <li
            key={item.id}
            className={`panel flex items-center gap-4 transition ${done ? "opacity-50" : ""}`}
          >
            <button
              type="button"
              onClick={() => toggleBought(item.id)}
              aria-pressed={done}
              aria-label={
                done
                  ? `Desmarcar ${item.product} como comprado`
                  : `Marcar ${item.product} como comprado`
              }
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg font-bold transition ${
                done
                  ? "border-acid bg-acid text-ink"
                  : "border-white/20 text-transparent hover:border-acid"
              }`}
            >
              ✓
            </button>

            <div className="min-w-0 flex-1">
              <p className={`truncate font-medium text-white ${done ? "line-through" : ""}`}>
                {item.product}
              </p>
              <p className="mt-1 text-sm text-muted">{item.deadline}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-semibold text-white">{item.quantity}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${WHEN_STYLE[item.when]}`}
              >
                {done ? "Comprado" : WHEN_LABEL[item.when]}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}