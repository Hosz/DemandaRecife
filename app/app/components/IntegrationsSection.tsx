"use client";

import React, { useState } from 'react';

interface IntegrationItem {
  id: string;
  name: string;
  subtitle: string;
  connected: boolean;
  icon: React.ReactNode;
}

export function IntegrationsSection() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: 'stone',
      name: 'Stone PDV',
      subtitle: 'Disponível para conectar',
      connected: false,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime-400"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
      ),
    },
    {
      id: 'pagseguro',
      name: 'PagSeguro',
      subtitle: 'Disponível para conectar',
      connected: false,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime-400"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
      ),
    },
    {
      id: 'clima',
      name: 'Clima Tempo',
      subtitle: 'Disponível para conectar',
      connected: false,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime-400"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
      ),
    },
    {
      id: 'calendario',
      name: 'Calendário regional',
      subtitle: 'Disponível para conectar',
      connected: false,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
      ),
    },
  ]);

  const toggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              connected: !item.connected,
              subtitle: !item.connected
                ? 'Sincronizado agora'
                : 'Disponível para conectar',
            }
          : item
      )
    );
  };

  return (
    <section className="panel">
      <p className="eyebrow">APIs e fontes externas</p>
      <h2 className="section-title mb-5">Integrações</h2>

      <div className="space-y-4">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl flex flex-col items-start gap-4"
          >
            <div className="flex flex-col items-start gap-3">
              <div className="p-2 bg-[#27272a] rounded-lg">
                {item.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="font-semibold text-[15px] text-white tracking-tight">{item.name}</h3>
                <p className="text-[13px] text-zinc-400">{item.subtitle}</p>
              </div>
            </div>

            <button
              onClick={() => toggleConnection(item.id)}
              className={`w-full py-2.5 rounded-lg font-semibold text-[14px] transition-colors ${
                item.connected
                  ? 'bg-transparent text-lime-400 border border-zinc-700'
                  : 'bg-[#a3e635] text-black hover:bg-[#84cc16]'
              }`}
            >
              {item.connected ? 'Conectado' : 'Conectar'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}