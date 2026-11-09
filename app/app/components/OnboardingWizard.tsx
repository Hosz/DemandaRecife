"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingData } from "../lib/api";
import { getUser } from "../lib/auth";
import { SEGMENT_CATEGORIES, ALL_SEGMENT_OPTIONS } from "../lib/segments";

type OnboardingWizardProps = {
  onSubmit: (data: OnboardingData) => Promise<boolean>;
};

const RECIFE_BAIRROS = [
  "Boa Viagem",
  "Pina",
  "Setúbal",
  "Brasília Teimosa",
  "Imbiribeira",
  "Ipsep",
  "Ibura",
  "Recife Antigo",
  "Santo Amaro",
  "Boa Vista",
  "Soledade",
  "Derby",
  "Espinheiro",
  "Graças",
  "Aflitos",
  "Jaqueira",
  "Parnamirim",
  "Casa Forte",
  "Casa Amarela",
  "Tamarineira",
  "Encruzilhada",
  "Torre",
  "Madalena",
  "Prado",
  "Cordeiro",
  "Várzea",
  "Caxangá",
  "Iputinga",
  "Afogados",
  "San Martin",
  "Areias",
  "Barro",
  "Tejipió",
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

  const [userName, setUserName] = useState(() => {
    if (typeof window === "undefined") return "";
    return getUser()?.nome ?? "";
  });
  const [businessName, setBusinessName] = useState("");
  const [bairro, setBairro] = useState(RECIFE_BAIRROS[0]);
  const [niche, setNiche] = useState(ALL_SEGMENT_OPTIONS[0].value);
  const [customNiche, setCustomNiche] = useState("");
  const [businessDays, setBusinessDays] = useState<string[]>([
    "SEG",
    "TER",
    "QUA",
    "QUI",
    "SEX",
    "SAB",
  ]);
  const [openingTime, setOpeningTime] = useState(ALL_SEGMENT_OPTIONS[0].defaultOpening);
  const [closingTime, setClosingTime] = useState(ALL_SEGMENT_OPTIONS[0].defaultClosing);
  const [averageTicket, setAverageTicket] = useState(ALL_SEGMENT_OPTIONS[0].defaultTicket.toFixed(2));

  function handleNicheChange(selectedValue: string) {
    setNiche(selectedValue);
    const match = ALL_SEGMENT_OPTIONS.find((o) => o.value === selectedValue);
    if (match) {
      setOpeningTime(match.defaultOpening);
      setClosingTime(match.defaultClosing);
      setAverageTicket(match.defaultTicket.toFixed(2));
    }
  }

  const ticketValue = Number(averageTicket);
  const sameTimes = Boolean(openingTime) && openingTime === closingTime;

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

  async function handleFinish(skipTicket = false) {
    if (loading) return;

    setLoading(true);
    const name = userName.trim();

    const finalNiche = niche === "Outro" && customNiche.trim() ? customNiche.trim() : niche;

    const success = await onSubmit({
      userName: name,
      businessName: businessName.trim() || undefined,
      niche: finalNiche,
      businessDays,
      openingTime,
      closingTime,
      averageTicket: !skipTicket && ticketValue > 0 ? ticketValue : undefined,
      cidade: "Recife",
      estado: "PE",
      bairro: bairro.trim() || undefined,
      usarBenchmarksColdStart: true,
    });

    setLoading(false);

    if (success) {
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
              Dados do responsável e do estabelecimento
            </h2>
            <p className="mt-1 text-xs text-muted">
              Informações essenciais para calibrar as previsões de demanda por bairro no Recife.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Seu nome (Responsável)</span>
              <input
                className="field text-base"
                type="text"
                placeholder="Ex: Marina Santos"
                autoComplete="given-name"
                maxLength={100}
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="field-label">Nome do negócio / estabelecimento</span>
              <input
                className="field text-base"
                type="text"
                placeholder="Ex: Panificadora Central"
                maxLength={100}
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="field-label">Segmento do negócio</span>
              <select
                className="field text-base"
                value={niche}
                onChange={(event) => handleNicheChange(event.target.value)}
              >
                {SEGMENT_CATEGORIES.map((cat) => (
                  <optgroup key={cat.category} label={`${cat.icon} ${cat.category}`}>
                    {cat.options.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-muted">
                💡 A escolha do segmento calibra automaticamente os horários de funcionamento, pico e os produtos de referência do Cold Start.
              </span>
            </label>

            {niche === "Outro" && (
              <label className="block sm:col-span-2">
                <span className="field-label text-[#d6ff00]">Especifique seu segmento</span>
                <input
                  className="field text-base"
                  type="text"
                  placeholder="Ex: Farmácia, Pet Shop, Barbearia, Floricultura"
                  maxLength={100}
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                  required
                />
              </label>
            )}

            <label className="block">
              <span className="field-label">Bairro no Recife</span>
              <select
                className="field text-base"
                value={bairro}
                onChange={(event) => setBairro(event.target.value)}
              >
                {RECIFE_BAIRROS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
              Informe os dias e horários em que o seu estabelecimento está aberto no Recife.
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

          {sameTimes && (
            <p className="text-xs text-muted">
              Abertura e fechamento não podem ser iguais.
            </p>
          )}

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
                businessDays.length === 0 ||
                !openingTime ||
                !closingTime ||
                sameTimes
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
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <p className="eyebrow">Passo 3 de 3</p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                Opcional
              </span>
            </div>
            <h2 className="section-title">Ticket médio estimado</h2>
            <p className="mt-1 text-xs text-muted">
              Qual é o valor médio gasto por cada cliente em cada compra?
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-zinc-300">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-base">💡</span>
              <div className="space-y-1">
                <p className="font-semibold text-white">Não tem esse valor agora?</p>
                <p className="text-muted leading-relaxed">
                  Não se preocupe! Você pode <strong>pular esta etapa</strong> agora e preencher o ticket médio mais tarde nas configurações da sua conta, ou quando tiver histórico de vendas.
                </p>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="field-label">Ticket médio (R$)</span>
            <input
              className="field text-base"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="Ex: 45,00 (ou deixe em branco para pular)"
              value={averageTicket}
              onKeyDown={handleTicketKeyDown}
              onChange={(event) => setAverageTicket(event.target.value)}
            />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={loading}
              className={secondaryButton}
            >
              Voltar
            </button>

            <div className="flex flex-1 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleFinish(true)}
                className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Pular etapa (definir depois)
              </button>

              <button
                type="button"
                disabled={loading || !(ticketValue > 0)}
                onClick={() => handleFinish(false)}
                className="primary-button"
              >
                {loading ? "Concluindo..." : "Salvar e finalizar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
