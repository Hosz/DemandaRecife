"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingData } from "../lib/api";

const CONTINUE_WHEN_API_FAILS = true;

type OnboardingWizardProps = {
  onSubmit: (data: OnboardingData) => Promise<boolean>;
};

const NICHES = [
  "Padaria / Confeitaria",
  "Salão de Beleza / Estética",
  "Autopeças / Oficina",
  "Mercado / Mercearia",
  "Restaurante / Bar",
  "Loja de Roupas / Vestuário",
  "Outro",
];

const DAYS_OF_WEEK = [
  { id: "SEG", label: "Seg" },
  { id: "TER", label: "Ter" },
  { id: "QUA", label: "Qua" },
  { id: "QUI", label: "Qui" },
  { id: "SEX", label: "Sex" },
  { id: "SAB", label: "Sáb" },
  { id: "DOM", label: "Dom" },
];

const STEPS = ["Perfil e nicho", "Horários", "Ticket médio"];
const BLOCKED_KEYS = ["e", "E", "+", "-"];

const secondaryButton =
  "w-1/3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold transition accent-button";

export function OnboardingWizard({ onSubmit }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [userName, setUserName] = useState("");
  const [niche, setNiche] = useState(NICHES[0]);
  const [businessDays, setBusinessDays] = useState<string[]>([
    "SEG",
    "TER",
    "QUA",
    "QUI",
    "SEX",
  ]);
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("18:00");
  const [averageTicket, setAverageTicket] = useState("");

  const ticketValue = Number(averageTicket);

  function toggleDay(dayId: string) {
    setBusinessDays((previous) =>
      previous.includes(dayId)
        ? previous.filter((day) => day !== dayId)
        : [...previous, dayId],
    );
  }

  function handleTicketKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (BLOCKED_KEYS.includes(event.key)) {
      event.preventDefault();
    }
  }

  async function handleFinish() {
    if (loading) return;

    setLoading(true);
    const name = userName.trim();

    const success = await onSubmit({
      userName: name,
      niche,
      businessDays,
      openingTime,
      closingTime,
      averageTicket: ticketValue,
    });

    setLoading(false);

    if (success || CONTINUE_WHEN_API_FAILS) {
      localStorage.setItem("user_name", name);
      router.replace("/");
    }
  }

  return (
    <div className="panel mx-auto max-w-xl space-y-6">
      <ol className="flex items-center justify-between border-b border-white/10 pb-4">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const current = step === number;
          const done = step > number;

          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className="flex items-center gap-2"
            >
              <span
                className={`grid size-8 place-items-center rounded-full text-sm font-bold ${
                  current
                    ? "bg-acid text-ink"
                    : done
                      ? "border border-acid/30 bg-white/[0.06] text-acid"
                      : "bg-white/[0.06] text-muted"
                }`}
              >
                {number}
              </span>
              <span className="hidden text-xs text-muted sm:inline">
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow">Passo 1 de 3</p>
            <h2 className="section-title">
              Como podemos te chamar e qual o seu nicho?
            </h2>
            <p className="mt-1 text-xs text-muted">
              Informações básicas para personalizar seu acesso e calibrar as
              previsões.
            </p>
          </div>

          <label className="block">
            <span className="field-label">Seu nome</span>
            <input
              className="field text-base"
              type="text"
              placeholder="Ex: Marina"
              autoComplete="given-name"
              maxLength={100}
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="field-label">Segmento do negócio</span>
            <select
              className="field text-base"
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
            >
              {NICHES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={!userName.trim()}
            onClick={() => setStep(2)}
            className="primary-button"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow">Passo 2 de 3</p>
            <h2 className="section-title">Horários de funcionamento</h2>
            <p className="mt-1 text-xs text-muted">
              Informe os dias e horários em que o seu estabelecimento está
              aberto.
            </p>
          </div>

          <div>
            <span className="field-label">Dias de funcionamento</span>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const active = businessDays.includes(day.id);

                return (
                  <button
                    key={day.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleDay(day.id)}
                    className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                      active
                        ? "bg-acid text-ink"
                        : "border border-white/10 bg-white/[0.05] text-muted hover:text-white"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            {businessDays.length === 0 && (
              <p className="mt-2 text-xs text-muted">
                Escolha pelo menos um dia.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="field-label">Abertura</span>
              <input
                className="field text-base [color-scheme:dark]"
                type="time"
                value={openingTime}
                onChange={(event) => setOpeningTime(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="field-label">Fechamento</span>
              <input
                className="field text-base [color-scheme:dark]"
                type="time"
                value={closingTime}
                onChange={(event) => setClosingTime(event.target.value)}
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={secondaryButton}
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={
                businessDays.length === 0 || !openingTime || !closingTime
              }
              onClick={() => setStep(3)}
              className="primary-button w-2/3"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow">Passo 3 de 3</p>
            <h2 className="section-title">Ticket médio estimado</h2>
            <p className="mt-1 text-xs text-muted">
              Qual é o valor médio gasto por cada cliente em cada compra?
            </p>
          </div>

          <label className="block">
            <span className="field-label">Ticket médio (R$)</span>
            <input
              className="field text-base"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="Ex: 45,00"
              value={averageTicket}
              onKeyDown={handleTicketKeyDown}
              onChange={(event) => setAverageTicket(event.target.value)}
            />
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={loading}
              className={secondaryButton}
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={loading || !(ticketValue > 0)}
              onClick={handleFinish}
              className="primary-button w-2/3"
            >
              {loading ? "Concluindo..." : "Finalizar onboarding"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}