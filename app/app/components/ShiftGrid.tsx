"use client";

import { useState, type FormEvent } from "react";
import type { TeamMemberItem } from "../lib/api";

export interface Turno {
  id: string;
  horario: string;
  horarioInicio?: string;
  horarioFim?: string;
  demanda: string;
  tipoDemanda: "baixa" | "media" | "alta";
  funcionarios: string[];
  vagaPendente?: boolean;
  funcao?: string;
  intervalo?: string;
  observacoes?: string;
}

interface ShiftGridProps {
  selectedDay?: string;
  shifts: Turno[];
  teamMembers?: TeamMemberItem[];
  onUpdateShift: (shiftId: string, updated: Partial<Turno>) => void;
  onAddShift?: (newShift: Omit<Turno, "id">) => void;
  onDeleteShift?: (shiftId: string) => void;
}

const FUNCOES = [
  "Atendimento / Balcão",
  "Caixa / Operador",
  "Cozinha / Produção",
  "Reposição / Estoque",
  "Limpeza / Apoio",
  "Geral",
];

const INTERVALOS = [
  "Sem intervalo",
  "15 min (lanche)",
  "30 min (refeição curta)",
  "1 hora (almoço / descanso)",
];

export function ShiftGrid({
  selectedDay = "Seg",
  shifts,
  teamMembers = [],
  onUpdateShift,
  onAddShift,
  onDeleteShift,
}: ShiftGridProps) {
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [tempHelperName, setTempHelperName] = useState("");
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);

  // States for new shift form
  const [newShiftStart, setNewShiftStart] = useState("06:00");
  const [newShiftEnd, setNewShiftEnd] = useState("14:00");
  const [newShiftDemanda, setNewShiftDemanda] = useState("Demanda média");
  const [newShiftTipo, setNewShiftTipo] = useState<"baixa" | "media" | "alta">("media");
  const [newShiftFuncao, setNewShiftFuncao] = useState("Atendimento / Balcão");
  const [newShiftIntervalo, setNewShiftIntervalo] = useState("1 hora (almoço / descanso)");
  const [newShiftObs, setNewShiftObs] = useState("");
  const [newShiftVaga, setNewShiftVaga] = useState(false);

  const editingShift = shifts.find((s) => s.id === editingShiftId) || null;

  function handleAddTemporaryHelper(e: FormEvent) {
    e.preventDefault();
    if (!editingShift || !tempHelperName.trim()) return;

    const trimmed = `${tempHelperName.trim()} (Diarista)`;
    if (!editingShift.funcionarios.includes(trimmed)) {
      onUpdateShift(editingShift.id, {
        funcionarios: [...editingShift.funcionarios, trimmed],
      });
    }
    setTempHelperName("");
  }

  function handleSelectRegisteredMember(name: string) {
    if (!editingShift) return;
    if (!editingShift.funcionarios.includes(name)) {
      onUpdateShift(editingShift.id, {
        funcionarios: [...editingShift.funcionarios, name],
      });
    }
  }

  function handleRemoveEmployee(shiftId: string, employeeToRemove: string) {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;

    onUpdateShift(shiftId, {
      funcionarios: shift.funcionarios.filter((n) => n !== employeeToRemove),
    });
  }

  function handleToggleVacancy(shiftId: string) {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;

    onUpdateShift(shiftId, {
      vagaPendente: !shift.vagaPendente,
    });
  }

  function handleCreateShift(e: FormEvent) {
    e.preventDefault();
    if (!onAddShift) return;

    const horario = `${newShiftStart.replace(":", "h")}–${newShiftEnd.replace(":", "h")}`;
    onAddShift({
      horario,
      horarioInicio: newShiftStart,
      horarioFim: newShiftEnd,
      demanda: newShiftDemanda,
      tipoDemanda: newShiftTipo,
      funcionarios: [],
      vagaPendente: newShiftVaga,
      funcao: newShiftFuncao,
      intervalo: newShiftIntervalo,
      observacoes: newShiftObs.trim() || undefined,
    });

    setShowAddShiftModal(false);
    setNewShiftObs("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Turnos de {selectedDay} ({shifts.length})
        </h3>
        {onAddShift && (
          <button
            type="button"
            onClick={() => setShowAddShiftModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            <span>+ Adicionar turno detalhado</span>
          </button>
        )}
      </div>

      {shifts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
          <p className="text-sm text-zinc-400">Nenhum turno configurado para este dia.</p>
          {onAddShift && (
            <button
              type="button"
              onClick={() => setShowAddShiftModal(true)}
              className="mt-3 inline-block rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              Criar primeiro turno
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <article
              key={shift.id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-[#121214] p-5 sm:flex-row sm:items-center sm:justify-between transition-all hover:border-zinc-700"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-bold text-white">{shift.horario}</h4>
                  
                  {shift.funcao && (
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                      {shift.funcao}
                    </span>
                  )}

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      shift.tipoDemanda === "alta"
                        ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                        : shift.tipoDemanda === "media"
                        ? "bg-amber-400/15 text-amber-300"
                        : "bg-zinc-700/30 text-zinc-400"
                    }`}
                  >
                    {shift.demanda}
                  </span>

                  {shift.intervalo && shift.intervalo !== "Sem intervalo" && (
                    <span className="text-[11px] text-zinc-400">
                      • Pausa: {shift.intervalo}
                    </span>
                  )}
                </div>

                {shift.observacoes && (
                  <p className="text-xs text-zinc-400 italic">
                    &ldquo;{shift.observacoes}&rdquo;
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {shift.funcionarios.map((nome) => (
                    <span
                      key={nome}
                      className={`group inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                        nome.includes("(Diarista)")
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          : "border-zinc-700/60 bg-zinc-800/50 text-white"
                      }`}
                    >
                      <span>{nome}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(shift.id, nome)}
                        className="text-zinc-400 transition hover:text-red-400"
                        title={`Remover ${nome}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {shift.vagaPendente && (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-dashed border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300">
                      <span>⚠️ 1 Vaga pendente</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setEditingShiftId(shift.id)}
                  className="rounded-xl border border-zinc-700/80 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700"
                >
                  Editar detalhes e escala
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleVacancy(shift.id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    shift.vagaPendente
                      ? "border-zinc-700 text-zinc-400 hover:text-white"
                      : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                  }`}
                >
                  {shift.vagaPendente ? "Remover vaga" : "+ Sinalizar vaga"}
                </button>

                {onDeleteShift && (
                  <button
                    type="button"
                    onClick={() => onDeleteShift(shift.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition text-sm"
                    title="Excluir turno"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal de Edição de Turno */}
      {editingShift && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#16171a] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4FF00]">
                  Configuração e Alocação
                </span>
                <h3 className="text-lg font-bold text-white">
                  Turno {editingShift.horario}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingShiftId(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Ajuste de Detalhes do Turno */}
            <div className="mt-4 space-y-4 border-b border-zinc-800 pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Horário do turno
                  </label>
                  <input
                    type="text"
                    value={editingShift.horario}
                    onChange={(e) => onUpdateShift(editingShift.id, { horario: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-[#D4FF00] focus:outline-none"
                    placeholder="Ex: 06h–14h"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Setor / Função
                  </label>
                  <select
                    value={editingShift.funcao || "Geral"}
                    onChange={(e) => onUpdateShift(editingShift.id, { funcao: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-[#D4FF00] focus:outline-none [color-scheme:dark]"
                  >
                    {FUNCOES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Intervalo / Pausa
                  </label>
                  <select
                    value={editingShift.intervalo || "Sem intervalo"}
                    onChange={(e) => onUpdateShift(editingShift.id, { intervalo: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-[#D4FF00] focus:outline-none [color-scheme:dark]"
                  >
                    {INTERVALOS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Demanda prevista
                  </label>
                  <select
                    value={editingShift.tipoDemanda}
                    onChange={(e) => {
                      const val = e.target.value as "baixa" | "media" | "alta";
                      onUpdateShift(editingShift.id, {
                        tipoDemanda: val,
                        demanda: val === "alta" ? "Demanda alta" : val === "baixa" ? "Demanda baixa" : "Demanda média",
                      });
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-[#D4FF00] focus:outline-none [color-scheme:dark]"
                  >
                    <option value="baixa">Demanda baixa</option>
                    <option value="media">Demanda média</option>
                    <option value="alta">Demanda alta (Pico)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Instruções / Observações do turno
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={editingShift.observacoes || ""}
                  onChange={(e) => onUpdateShift(editingShift.id, { observacoes: e.target.value })}
                  placeholder="Ex: Foco no atendimento rápido e reposição do balcão"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-[#D4FF00] focus:outline-none"
                />
              </div>
            </div>

            {/* Seção 1: Colaboradores Fixos Cadastrados */}
            <div className="mt-5 border-b border-zinc-800 pb-5">
              <span className="block text-xs font-bold text-white mb-1">
                1. Alocar colaborador da equipe fixa:
              </span>
              <p className="text-[11px] text-zinc-400 mb-3">
                Selecione os funcionários já cadastrados no seu estabelecimento.
              </p>

              {teamMembers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {teamMembers.map((m) => {
                    const alreadyIn = editingShift.funcionarios.includes(m.nome);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={alreadyIn}
                        onClick={() => handleSelectRegisteredMember(m.nome)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          alreadyIn
                            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                            : "bg-[#D4FF00]/10 text-[#D4FF00] hover:bg-[#D4FF00]/20"
                        }`}
                      >
                        + {m.nome} {m.cargo ? `(${m.cargo})` : ""}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">
                  Nenhum colaborador cadastrado. Cadastre no botão &ldquo;Gerenciar equipe&rdquo;.
                </p>
              )}
            </div>

            {/* Seção 2: Apoio Temporário / Diarista (Freelancer) */}
            <form onSubmit={handleAddTemporaryHelper} className="mt-5 space-y-3">
              <div>
                <span className="block text-xs font-bold text-amber-300 mb-0.5">
                  2. Apoio temporário / Diarista (Freelancer):
                </span>
                <p className="text-[11px] text-zinc-400">
                  Para reforços pontuais ou diaristas deste turno. <strong>Não adiciona</strong> a pessoa no quadro permanente de funcionários.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempHelperName}
                  onChange={(e) => setTempHelperName(e.target.value)}
                  placeholder="Nome do diarista / folguista"
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3.5 py-2 text-xs font-bold hover:bg-amber-400/30 transition"
                >
                  Adicionar Diarista
                </button>
              </div>
            </form>

            <div className="mt-6 pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setEditingShiftId(null)}
                className="w-full rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-white hover:bg-zinc-700"
              >
                Concluir edições
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Novo Turno Detalhado */}
      {showAddShiftModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#16171a] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4FF00]">
                  Novo Turno Operacional
                </span>
                <h3 className="text-lg font-bold text-white">Criar turno ({selectedDay})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddShiftModal(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Início</label>
                  <input
                    type="time"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Fim</label>
                  <input
                    type="time"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Setor / Função</label>
                <select
                  value={newShiftFuncao}
                  onChange={(e) => setNewShiftFuncao(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white [color-scheme:dark]"
                >
                  {FUNCOES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Intervalo / Pausa</label>
                  <select
                    value={newShiftIntervalo}
                    onChange={(e) => setNewShiftIntervalo(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white [color-scheme:dark]"
                  >
                    {INTERVALOS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Demanda prevista</label>
                  <select
                    value={newShiftTipo}
                    onChange={(e) => {
                      const val = e.target.value as "baixa" | "media" | "alta";
                      setNewShiftTipo(val);
                      setNewShiftDemanda(val === "alta" ? "Demanda alta" : val === "baixa" ? "Demanda baixa" : "Demanda média");
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white [color-scheme:dark]"
                  >
                    <option value="baixa">Demanda baixa</option>
                    <option value="media">Demanda média</option>
                    <option value="alta">Demanda alta (Pico)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Observações operacionais
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={newShiftObs}
                  onChange={(e) => setNewShiftObs(e.target.value)}
                  placeholder="Ex: Foco no fechamento e conferência de caixa"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-[#D4FF00] focus:outline-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newShiftVaga}
                    onChange={(e) => setNewShiftVaga(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#D4FF00] focus:ring-0"
                  />
                  <span className="text-xs text-zinc-300">
                    Sinalizar vaga em aberto (precisa de escala)
                  </span>
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddShiftModal(false)}
                  className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#D4FF00] py-2.5 text-xs font-bold text-black hover:brightness-105"
                >
                  Salvar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
