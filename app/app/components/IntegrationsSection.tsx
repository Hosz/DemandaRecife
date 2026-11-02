"use client";

import { useState } from "react";

const integrations = [
  { id: "stone", name: "Stone PDV", icon: "▤" },
  { id: "pagbank", name: "PagSeguro", icon: "▤" },
  { id: "clima", name: "Clima Tempo", icon: "☼" },
  { id: "calendario", name: "Calendário regional", icon: "▣" },
];

export function IntegrationsSection() {
  const [connected, setConnected] = useState<string[]>([
    "pagbank",
    "clima",
  ]);

  function toggleConnection(id: string) {
    setConnected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#191919] p-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d6ff00]">
        API e fontes externas
      </p>

      <h2 className="mb-3 mt-1 text-sm font-semibold">
        Integrações
      </h2>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {integrations.map((integration) => {
          const isConnected = connected.includes(integration.id);

          return (
            <div
              key={integration.id}
              className="rounded-xl border border-white/[0.07] bg-[#202020] p-3"
            >
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#292d18] text-sm text-[#d6ff00]">
                {integration.icon}
              </div>

              <h3 className="text-[11px] font-bold">
                {integration.name}
              </h3>

              <p className="mt-0.5 text-[9px] text-neutral-500">
                {isConnected
                  ? "Sincronizado agora"
                  : "Disponível para conectar"}
              </p>

              <button
                type="button"
                onClick={() => toggleConnection(integration.id)}
                className={`mt-2 w-full rounded-lg border px-2 py-1.5 text-[10px] font-bold ${
                  isConnected
                    ? "border-white/10 bg-[#292929] text-neutral-400"
                    : "border-transparent bg-[#d6ff00] text-black"
                }`}
              >
                {isConnected ? "Conectado" : "Conectar"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}