"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertPanel } from "../components/AlertPanel";
import { ShiftGrid, type Turno } from "../components/ShiftGrid";
import { useToast } from "../components/ToastProvider";
import {
  fetchTeamMembers,
  createTeamMember,
  deleteTeamMember,
  fetchShifts,
  saveShift,
  deleteShift,
  type TeamMemberItem,
} from "../lib/api";

type WeekDay = {
  label: string;
  short: string;
  dateStr: string;
  isToday: boolean;
};

function getCurrentWeekDays(): WeekDay[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Dom, 1 is Seg...
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);

  const shortNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const days: WeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayNum = String(d.getDate()).padStart(2, "0");
    const short = shortNames[i];
    const isToday = d.toDateString() === now.toDateString();
    days.push({
      label: `${short} ${dayNum}`,
      short,
      dateStr: d.toISOString().slice(0, 10),
      isToday,
    });
  }

  return days;
}

export default function EquipePage() {
  const { showToast } = useToast();
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const todayLabel = weekDays.find((w) => w.isToday)?.label || weekDays[0].label;

  const [selectedDay, setSelectedDay] = useState(todayLabel);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [shifts, setShifts] = useState<Turno[]>([]);
  const [isSuggestionApplied, setIsSuggestionApplied] = useState(false);

  // Modal para gerenciar equipe
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Atendente");

  // Carrega membros cadastrados no tenant
  useEffect(() => {
    async function loadMembers() {
      const list = await fetchTeamMembers();
      setTeamMembers(list);
    }
    void loadMembers();
  }, []);

  // Extrai o nome curto do dia (ex: "Seg", "Ter") para a API
  const selectedShortDay = useMemo(() => {
    return selectedDay.split(" ")[0];
  }, [selectedDay]);

  // Carrega os turnos do dia selecionado
  useEffect(() => {
    async function loadDayShifts() {
      const apiShifts = await fetchShifts(selectedShortDay);
      if (apiShifts && apiShifts.length > 0) {
        setShifts(
          apiShifts.map((s) => ({
            id: s.id || String(Math.random()),
            horario: s.horario,
            horarioInicio: s.horarioInicio,
            horarioFim: s.horarioFim,
            demanda: s.demanda,
            tipoDemanda: s.tipoDemanda,
            funcionarios: s.funcionarios || [],
            vagaPendente: Boolean(s.vagaPendente),
            funcao: s.funcao || "Geral",
            intervalo: s.intervalo,
            observacoes: s.observacoes,
          })),
        );
      } else {
        // Se ainda não houver turnos cadastrados no banco para o dia, inicia com estrutura limpa
        setShifts([]);
      }
      setIsSuggestionApplied(false);
    }
    void loadDayShifts();
  }, [selectedShortDay]);

  // Atualiza um turno e salva no backend
  async function handleUpdateShift(shiftId: string, updated: Partial<Turno>) {
    const updatedList = shifts.map((s) => (s.id === shiftId ? { ...s, ...updated } : s));
    setShifts(updatedList);

    const shiftToSave = updatedList.find((s) => s.id === shiftId);
    if (shiftToSave) {
      await saveShift({
        id: shiftToSave.id.includes("-") ? shiftToSave.id : undefined, // UUID check
        diaSemana: selectedShortDay,
        horario: shiftToSave.horario,
        horarioInicio: shiftToSave.horarioInicio,
        horarioFim: shiftToSave.horarioFim,
        demanda: shiftToSave.demanda,
        tipoDemanda: shiftToSave.tipoDemanda,
        vagaPendente: shiftToSave.vagaPendente,
        funcao: shiftToSave.funcao,
        intervalo: shiftToSave.intervalo,
        observacoes: shiftToSave.observacoes,
        funcionarios: shiftToSave.funcionarios,
      });
      showToast("success", "Turno atualizado no sistema!");
    }
  }

  // Cria um novo turno
  async function handleAddShift(newShiftData: Omit<Turno, "id">) {
    const saved = await saveShift({
      diaSemana: selectedShortDay,
      horario: newShiftData.horario,
      horarioInicio: newShiftData.horarioInicio,
      horarioFim: newShiftData.horarioFim,
      demanda: newShiftData.demanda,
      tipoDemanda: newShiftData.tipoDemanda,
      vagaPendente: newShiftData.vagaPendente,
      funcao: newShiftData.funcao,
      intervalo: newShiftData.intervalo,
      observacoes: newShiftData.observacoes,
      funcionarios: newShiftData.funcionarios,
    });

    if (saved) {
      setShifts((prev) => [
        ...prev,
        {
          id: saved.id || String(Math.random()),
          horario: saved.horario,
          horarioInicio: saved.horarioInicio,
          horarioFim: saved.horarioFim,
          demanda: saved.demanda,
          tipoDemanda: saved.tipoDemanda,
          funcionarios: saved.funcionarios,
          vagaPendente: saved.vagaPendente,
          funcao: saved.funcao,
          intervalo: saved.intervalo,
          observacoes: saved.observacoes,
        },
      ]);
      showToast("success", "Novo turno adicionado com sucesso!");
    } else {
      showToast("error", "Não foi possível salvar o turno.");
    }
  }

  // Exclui um turno
  async function handleDeleteShift(shiftId: string) {
    if (shiftId.includes("-")) {
      await deleteShift(shiftId);
    }
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    showToast("success", "Turno removido.");
  }

  // Aplica recomendação da IA
  async function handleApplyAiSuggestion() {
    let applied = false;
    const updated = shifts.map((s) => {
      if (s.tipoDemanda === "alta" && !applied) {
        applied = true;
        const reforco = teamMembers.length > 0 ? teamMembers[0].nome : "Reforço";
        const funcs = s.funcionarios.includes(reforco) ? s.funcionarios : [...s.funcionarios, reforco];
        return { ...s, funcionarios: funcs, vagaPendente: false };
      }
      return s;
    });

    setShifts(updated);
    setIsSuggestionApplied(true);

    const shiftAlta = updated.find((s) => s.tipoDemanda === "alta");
    if (shiftAlta) {
      await saveShift({
        id: shiftAlta.id.includes("-") ? shiftAlta.id : undefined,
        diaSemana: selectedShortDay,
        horario: shiftAlta.horario,
        demanda: shiftAlta.demanda,
        tipoDemanda: shiftAlta.tipoDemanda,
        vagaPendente: false,
        funcionarios: shiftAlta.funcionarios,
      });
    }
    showToast("success", "Sugestão da IA aplicada ao fechamento!");
  }

  // Cadastro de novo membro da equipe
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const res = await createTeamMember(newMemberName.trim(), newMemberRole);
    if (res) {
      setTeamMembers((prev) => [...prev, res]);
      setNewMemberName("");
      showToast("success", `${res.nome} adicionado à equipe!`);
    } else {
      showToast("error", "Erro ao cadastrar colaborador.");
    }
  }

  // Exclusão de membro da equipe
  async function handleDeleteMember(id: string, nome: string) {
    const ok = await deleteTeamMember(id);
    if (ok) {
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
      showToast("success", `${nome} removido da equipe.`);
    }
  }

  // Métricas calculadas dinamicamente
  const totalEmployees = useMemo(() => {
    const unique = new Set<string>();
    shifts.forEach((s) => s.funcionarios.forEach((f) => unique.add(f)));
    return unique.size;
  }, [shifts]);

  const criticalShift = useMemo(() => {
    return shifts.find((s) => s.tipoDemanda === "alta") || null;
  }, [shifts]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4FF00]">
            Produtividade e Dimensionamento
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Escala da Equipe
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Dimensione turnos conforme o fluxo previsto e evite gargalos na operação.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMemberModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#D4FF00] px-4 py-2.5 text-xs sm:text-sm font-bold text-black transition hover:brightness-105"
        >
          <span>👥 Gerenciar Colaboradores ({teamMembers.length})</span>
        </button>
      </header>

      {/* Seletor Dinâmico de Dias da Semana Corrente */}
      <div className="mb-6">
        <div className="overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-900 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400">
          <div className="flex gap-2 w-max pb-1">
            {weekDays.map((day) => {
              const isSelected = selectedDay === day.label;
              return (
                <button
                  key={day.label}
                  type="button"
                  onClick={() => setSelectedDay(day.label)}
                  className={`flex-shrink-0 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-white text-black shadow-md font-bold"
                      : "border border-zinc-800 bg-[#121214] text-zinc-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{day.label}</span>
                    {day.isToday && (
                      <span className="size-1.5 rounded-full bg-[#D4FF00]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cards de Métricas do Dia Selecionado */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative rounded-2xl border border-zinc-800 bg-[#121214] p-5">
          <div className="absolute right-4 top-4 rounded-full bg-[#D4FF00]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#D4FF00]">
            ALOCAÇÃO
          </div>
          <p className="text-xs text-zinc-400">Equipe alocada</p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalEmployees} {totalEmployees === 1 ? "colaborador" : "colaboradores"}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">em {selectedDay}</p>
        </div>

        <div className="relative rounded-2xl border border-zinc-800 bg-[#121214] p-5">
          <div className="absolute right-4 top-4 rounded-full bg-[#D4FF00]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#D4FF00]">
            PICO
          </div>
          <p className="text-xs text-zinc-400">Turno crítico de movimento</p>
          <p className="text-2xl font-bold text-white mt-1">
            {criticalShift ? criticalShift.horario : "Não configurado"}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">maior concentração de clientes</p>
        </div>

        <div className="relative rounded-2xl border border-zinc-800 bg-[#121214] p-5">
          <div className="absolute right-4 top-4 rounded-full bg-[#D4FF00]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#D4FF00]">
            CADASTRO
          </div>
          <p className="text-xs text-zinc-400">Total na sua equipe</p>
          <p className="text-2xl font-bold text-white mt-1">
            {teamMembers.length} {teamMembers.length === 1 ? "pessoa" : "pessoas"}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">cadastradas no seu negócio</p>
        </div>
      </div>

      {/* Grid de Turnos do Dia e Painel de Recomendações */}
      <div className="space-y-6">
        <ShiftGrid
          selectedDay={selectedDay}
          shifts={shifts}
          teamMembers={teamMembers}
          onUpdateShift={handleUpdateShift}
          onAddShift={handleAddShift}
          onDeleteShift={handleDeleteShift}
        />

        <AlertPanel
          onApplySuggestion={handleApplyAiSuggestion}
          isApplied={isSuggestionApplied}
        />
      </div>

      {/* Modal para Gerenciar Colaboradores da Equipe */}
      {showMemberModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#16171a] p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4FF00]">
                  Gestão de Pessoas
                </span>
                <h3 className="text-lg font-bold text-white">Equipe de Colaboradores</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Formulário para cadastrar novo colaborador */}
            <form onSubmit={handleAddMember} className="mt-4 border-b border-zinc-800 pb-4">
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Cadastrar novo colaborador:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Nome do colaborador"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="sm:col-span-6 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-[#D4FF00] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Cargo / Função"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="sm:col-span-4 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-[#D4FF00] focus:outline-none"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 rounded-xl bg-[#D4FF00] py-2 text-xs font-bold text-black hover:brightness-105"
                >
                  Salvar
                </button>
              </div>
            </form>

            {/* Lista de Colaboradores Cadastrados */}
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
              <p className="text-xs font-semibold text-zinc-400 mb-1">
                Colaboradores cadastrados ({teamMembers.length}):
              </p>
              {teamMembers.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  Nenhum colaborador cadastrado ainda. Adicione os membros da sua equipe acima.
                </p>
              ) : (
                teamMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{m.nome}</p>
                      <p className="text-[11px] text-zinc-400">{m.cargo || "Colaborador"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(m.id, m.nome)}
                      className="text-xs text-zinc-500 hover:text-red-400 transition"
                      title="Excluir"
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="w-full rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-white hover:bg-zinc-700"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
