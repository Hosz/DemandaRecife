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
import {
  fetchDailyRecommendations,
  applyRecommendation,
  type AiInsightItem,
} from "../lib/dashboard";

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
  const [, setLoadingShifts] = useState<boolean>(true);

  // Insight Real da IA para Equipe
  const [equipeInsight, setEquipeInsight] = useState<AiInsightItem | null>(null);
  const [loadingInsight, setLoadingInsight] = useState<boolean>(true);
  const [isAiApplied, setIsAiApplied] = useState<boolean>(false);
  const [highlightedShiftId, setHighlightedShiftId] = useState<string | null>(null);

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

  // Carrega recomendação diária da IA para categoria EQUIPE
  useEffect(() => {
    let ignore = false;
    async function loadInsight() {
      const recs = await fetchDailyRecommendations();
      if (!ignore) {
        const match = (recs || []).find((r) => r.categoria === "EQUIPE");
        if (match) {
          setEquipeInsight(match);
          if (match.status === "APLICADO") {
            setIsAiApplied(true);
          }
        }
        setLoadingInsight(false);
      }
    }
    void loadInsight();
    return () => {
      ignore = true;
    };
  }, []);

  // Extrai o nome curto do dia (ex: "Seg", "Ter") para a API
  const selectedShortDay = useMemo(() => {
    return selectedDay.split(" ")[0];
  }, [selectedDay]);

  // Carrega os turnos do dia selecionado
  useEffect(() => {
    let ignore = false;
    async function loadDayShifts() {
      setLoadingShifts(true);
      const apiShifts = await fetchShifts(selectedShortDay);
      if (!ignore) {
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
          setShifts([]);
        }
        setLoadingShifts(false);
      }
    }
    void loadDayShifts();
    return () => {
      ignore = true;
    };
  }, [selectedShortDay]);

  // Parâmetros inferidos da sugestão de IA
  const suggestedTimeRange = useMemo(() => {
    let inicio = "17:00";
    let fim = "21:00";

    if (equipeInsight?.payloadAcao?.horarioInicio && typeof equipeInsight.payloadAcao.horarioInicio === "string") {
      inicio = equipeInsight.payloadAcao.horarioInicio;
    }
    if (equipeInsight?.payloadAcao?.horarioFim && typeof equipeInsight.payloadAcao.horarioFim === "string") {
      fim = equipeInsight.payloadAcao.horarioFim;
    }

    const fullText = `${equipeInsight?.acaoSugerida || ""} ${equipeInsight?.title || ""} ${equipeInsight?.diagnostico || ""}`;
    const timeMatch = fullText.match(/(\d{1,2})(?:[h:](\d{2}))?\s*(?:às|as|a|até|-|–)\s*(\d{1,2})(?:[h:](\d{2}))?/i);
    if (timeMatch && (!equipeInsight?.payloadAcao?.horarioInicio || !equipeInsight?.payloadAcao?.horarioFim)) {
      const h1 = parseInt(timeMatch[1], 10);
      const m1 = timeMatch[2] ? timeMatch[2] : "00";
      const h2 = parseInt(timeMatch[3], 10);
      const m2 = timeMatch[4] ? timeMatch[4] : "00";
      if (h1 >= 0 && h1 <= 23 && h2 >= 0 && h2 <= 23) {
        inicio = `${String(h1).padStart(2, "0")}:${m1}`;
        fim = `${String(h2).padStart(2, "0")}:${m2}`;
      }
    }

    return { inicio, fim };
  }, [equipeInsight]);

  const suggestedRole = useMemo(() => {
    if (equipeInsight?.payloadAcao?.funcao && typeof equipeInsight.payloadAcao.funcao === "string") {
      return equipeInsight.payloadAcao.funcao;
    }
    const fullText = `${equipeInsight?.title || ""} ${equipeInsight?.diagnostico || ""} ${equipeInsight?.acaoSugerida || ""}`.toLowerCase();
    if (fullText.includes("caixa")) return "Caixa / Operador";
    if (fullText.includes("cozinha") || fullText.includes("produção")) return "Cozinha / Produção";
    if (fullText.includes("estoque") || fullText.includes("reposi")) return "Reposição / Estoque";
    return "Atendimento / Balcão";
  }, [equipeInsight]);

  const suggestedCollaborator = useMemo(() => {
    if (equipeInsight?.payloadAcao?.funcionario && typeof equipeInsight.payloadAcao.funcionario === "string") {
      const found = teamMembers.find((m) => m.nome.toLowerCase() === (equipeInsight.payloadAcao?.funcionario as string).toLowerCase());
      if (found) return found.nome;
      return equipeInsight.payloadAcao.funcionario as string;
    }

    const matchedShift = shifts.find(
      (s) =>
        s.vagaPendente ||
        s.tipoDemanda === "alta" ||
        s.horario.includes(suggestedTimeRange.inicio.slice(0, 2)),
    );

    if (teamMembers.length > 0) {
      const freeMember = teamMembers.find((m) => !matchedShift?.funcionarios.includes(m.nome));
      if (freeMember) return freeMember.nome;
      return teamMembers[0].nome;
    }

    return "Reforço Temporário (Diarista)";
  }, [equipeInsight, teamMembers, shifts, suggestedTimeRange]);

  const aiSuggestedShiftData = useMemo(() => {
    if (!equipeInsight) return null;
    return {
      horarioInicio: suggestedTimeRange.inicio,
      horarioFim: suggestedTimeRange.fim,
      demanda: "Demanda alta (Pico da IA)",
      tipoDemanda: "alta" as const,
      funcao: suggestedRole,
      intervalo: "15 min (lanche)",
      observacoes: `Reforço indicado pela IA para cobrir o pico das ${suggestedTimeRange.inicio} às ${suggestedTimeRange.fim}.`,
    };
  }, [equipeInsight, suggestedTimeRange, suggestedRole]);

  // Atualiza um turno e salva no backend
  async function handleUpdateShift(shiftId: string, updated: Partial<Turno>) {
    const updatedList = shifts.map((s) => (s.id === shiftId ? { ...s, ...updated } : s));
    setShifts(updatedList);

    const shiftToSave = updatedList.find((s) => s.id === shiftId);
    if (shiftToSave) {
      await saveShift({
        id: shiftToSave.id.includes("-") ? shiftToSave.id : undefined,
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

  // Aplica recomendação real da IA
  async function handleAplicarSugestaoIA() {
    if (!equipeInsight) return;

    const targetCollaborator = suggestedCollaborator;
    const { inicio, fim } = suggestedTimeRange;
    const formattedHorario = `${inicio.replace(":", "h")}–${fim.replace(":", "h")}`;

    // 1. Procura turno existente com vaga pendente, demanda alta ou horário compatível
    const targetShift =
      shifts.find((s) => equipeInsight.payloadAcao?.shiftId && s.id === equipeInsight.payloadAcao.shiftId) ||
      shifts.find((s) => s.vagaPendente) ||
      shifts.find((s) => s.tipoDemanda === "alta") ||
      shifts.find((s) => s.horario.includes(inicio.slice(0, 2)));

    let affectedShiftId = "";

    if (targetShift) {
      affectedShiftId = targetShift.id;
      const currentFuncs = targetShift.funcionarios || [];
      const updatedFuncs = currentFuncs.includes(targetCollaborator)
        ? currentFuncs
        : [...currentFuncs, targetCollaborator];

      await handleUpdateShift(targetShift.id, {
        funcionarios: updatedFuncs,
        vagaPendente: false,
        tipoDemanda: "alta",
        demanda: targetShift.demanda || "Demanda alta (Pico)",
        funcao: targetShift.funcao || suggestedRole,
      });
    } else {
      // 2. Se não houver turno no horário de pico sugerido pela IA, cria o turno completo
      const saved = await saveShift({
        diaSemana: selectedShortDay,
        horario: formattedHorario,
        horarioInicio: inicio,
        horarioFim: fim,
        demanda: "Demanda alta (Pico)",
        tipoDemanda: "alta",
        vagaPendente: false,
        funcao: suggestedRole,
        intervalo: "15 min (lanche)",
        observacoes: "Turno de reforço adicionado automaticamente pela IA para cobrir o pico.",
        funcionarios: [targetCollaborator],
      });

      if (saved) {
        affectedShiftId = saved.id || "";
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
      }
    }

    // 3. Destaca visualmente o turno preenchido
    if (affectedShiftId) {
      setHighlightedShiftId(affectedShiftId);
      setTimeout(() => setHighlightedShiftId(null), 3000);
    }

    // 4. Salva status de aplicado no backend
    setIsAiApplied(true);
    if (equipeInsight.id) {
      void applyRecommendation(equipeInsight.id);
    }

    showToast(
      "success",
      `Sugestão da IA aplicada! Turno ${formattedHorario} alocado com ${targetCollaborator} (${suggestedRole}) e vaga preenchida.`,
    );
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
          highlightedShiftId={highlightedShiftId}
          aiSuggestedShift={aiSuggestedShiftData}
        />

        {/* Card no Molde Original (AlertPanel), alimentado com dados reais e botão 100% funcional */}
        <AlertPanel
          insight={equipeInsight}
          loading={loadingInsight}
          onApplySuggestion={handleAplicarSugestaoIA}
          isApplied={isAiApplied}
          suggestedHorario={`${suggestedTimeRange.inicio} às ${suggestedTimeRange.fim}`}
          suggestedCollaborator={suggestedCollaborator}
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
