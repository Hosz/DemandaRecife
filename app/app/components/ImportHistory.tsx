"use client";

import React from 'react';

export interface ImportRecord {
  id: string;
  source: string;
  records: string | number;
  date: string;
  status: 'Processado' | 'Revisar' | 'Erro';
}

interface ImportHistoryProps {
  historyData?: ImportRecord[];
}

export function ImportHistory({ historyData = [] }: ImportHistoryProps) {
  return (
    <section className="panel overflow-hidden">
      <p className="eyebrow">Histórico de ingestão</p>
      <h2 className="section-title mb-5">Últimas importações</h2>

      <div className="mt-5 rounded-xl border border-zinc-800/60 bg-[#18181b] overflow-hidden">
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-left text-[14px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-800/60 text-zinc-400">
                <th className="px-4 py-4 font-medium">Fonte</th>
                <th className="px-4 py-4 font-medium text-right">Registros</th>
                <th className="px-4 py-4 font-medium">Data</th>
                <th className="px-4 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {historyData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-sm">
                    Nenhuma importação registrada ainda.
                  </td>
                </tr>
              ) : (
                historyData.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-4 text-zinc-200">{row.source}</td>
                    <td className="px-4 py-4 text-right text-zinc-400">{row.records}</td>
                    <td className="px-4 py-4 text-zinc-400">{row.date}</td>
                    <td className="px-4 py-4">
                      {row.status === 'Processado' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#a3e635]/10 text-[#a3e635]">
                          Processado
                        </span>
                      )}
                      {row.status === 'Revisar' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-white">
                          Revisar
                        </span>
                      )}
                      {row.status === 'Erro' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500">
                          Erro
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}