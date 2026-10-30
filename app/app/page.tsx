"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import {
  EXAMPLE_BRIEFING,
  fetchDailyBriefing,
  type DailyBriefingData,
} from "./lib/dashboard";

const USE_EXAMPLE_DATA_ON_ERROR = true;

type FlowPoint = NonNullable<DailyBriefingData["customerFlow"]>[number];

function Icon({
  children,
  size = 20,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const sunIcon = (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Icon>
);

const barsIcon = (
  <Icon>
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
  </Icon>
);

const usersIcon = (
  <Icon>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

const boxIcon = (
  <Icon>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </Icon>
);

const sparklesPaths = (
  <>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </>
);

const checkIcon = (
  <Icon size={16}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

const chevronIcon = (
  <Icon size={16}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

function SectionHeading({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

function MetricCard({
  icon,
  badge,
  label,
  value,
  caption,
}: {
  icon: ReactNode;
  badge: string;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <article className="panel metric-card transition">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-white/[0.06] text-acid transition metric-card-icon">
          {icon}
        </span>
        <span className="rounded-full bg-acid/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-acid">
          {badge}
        </span>
      </div>
      <p className="mt-6 text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{caption}</p>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-acid/10 text-acid">
        {icon}
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
        {description}
      </p>
      {action}
    </div>
  );
}

function FlowChart({ points }: { points: FlowPoint[] }) {
  const scaleMax = Math.max(...points.map((point) => point.value), 1) * 1.1;

  return (
    <div
      className="mt-6"
      role="img"
      aria-label="Gráfico de fluxo de clientes por horário"
    >
      <div className="relative h-44 border-b border-white/10 px-1">
        {[0, 1, 2].map((line) => (
          <div
            key={line}
            className="absolute inset-x-0 border-t border-dashed border-white/10"
            style={{ top: `${line * 33.33}%` }}
          />
        ))}

        <div className="relative flex h-full items-end gap-2.5">
          {points.map((point) => (
            <div
              key={point.hour}
              className="relative flex-1 rounded-t-md"
              style={{
                height: `${(point.value / scaleMax) * 100}%`,
                background: "linear-gradient(to bottom, #d6ff00, #3b4600)",
              }}
            >
              {point.highlight && (
                <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-ink shadow">
                  {point.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex gap-2.5 px-1">
        {points.map((point) => (
          <span
            key={point.hour}
            className="flex-1 text-center text-[11px] text-muted"
          >
            {point.hour}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function InicioPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [data, setData] = useState<DailyBriefingData | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchDailyBriefing();

    setLoadedAt(
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );

    if (result) {
      setData(result);
      setStatus("ready");
      return;
    }

    if (USE_EXAMPLE_DATA_ON_ERROR) {
      setData(EXAMPLE_BRIEFING);
      setStatus("ready");
      return;
    }

    setStatus("error");
  }, []);

  useEffect(() => {
    setUserName(localStorage.getItem("user_name"));
    load();
  }, [load]);

  function handleRetry() {
    setStatus("loading");
    load();
  }

  const flow = data?.customerFlow ?? [];
  const alerts = data?.alerts ?? [];
  const replenishment = data?.replenishment ?? [];
  const stockCount = data?.metrics?.stockAlertsCount ?? 0;
  const updatedAt = data?.updatedAt ?? loadedAt;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 sm:mb-8">
        {status === "ready" && updatedAt && (
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-acid">
            <span className="block size-2 animate-pulse rounded-full bg-acid" />
            Briefing atualizado às {updatedAt}
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          {userName ? `Bom dia, ${userName}.` : "Bom dia."}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-base">
          Hoje promete ser movimentado. Aqui está o que merece sua atenção.
        </p>
      </header>

      {status === "loading" && <DashboardSkeleton />}

      {status === "error" && (
        <section className="panel text-center">
          <p className="section-title">Não foi possível carregar o briefing</p>
          <p className="mt-2 text-sm text-muted">
            Verifique sua conexão e tente novamente.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="primary-button mx-auto mt-5 max-w-xs"
          >
            Tentar de novo
          </button>
        </section>
      )}

      {status === "ready" && data && (
        <>
          {data.weather && (
            <div className="mb-4 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
              <span className="text-acid">{sunIcon}</span>
              <div>
                <p className="text-sm font-semibold">
                  {data.weather.temp} · {data.weather.condition}
                </p>
                <p className="text-xs text-muted">
                  {data.weather.location} · {data.weather.date}
                </p>
              </div>
            </div>
          )}

          {data.metrics && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={barsIcon}
                badge={data.metrics.salesDiff}
                label="Vendas previstas"
                value={data.metrics.salesForecast}
                caption="vs. média das quartas"
              />
              <MetricCard
                icon={usersIcon}
                badge="Alta"
                label="Pico de movimento"
                value={data.metrics.peakHour}
                caption={data.metrics.peakRange}
              />
              <MetricCard
                icon={boxIcon}
                badge="Atenção"
                label="Alertas de estoque"
                value={`${stockCount} ${stockCount === 1 ? "item" : "itens"}`}
                caption="precisam de ação hoje"
              />
              <MetricCard
                icon={<Icon>{sparklesPaths}</Icon>}
                badge={data.metrics.accuracyDiff}
                label="Acurácia do modelo"
                value={data.metrics.modelAccuracy}
                caption="confiança da previsão"
              />
            </div>
          )}

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            <section className="panel">
              <SectionHeading
                eyebrow="Previsão de hoje"
                title="Fluxo de clientes"
              />

              {flow.length > 0 ? (
                <>
                  <FlowChart points={flow} />

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-sm font-semibold">Previsão útil?</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Seu feedback melhora as análises.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold transition accent-button"
                      >
                        {checkIcon}
                        Parece certo
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semiboldtransition accent-button"
                      >
                        Corrigir
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={barsIcon}
                  title="Ainda não há previsão para hoje"
                  description="Registre algumas vendas para o sistema começar a prever o fluxo de clientes."
                  action={
                    <Link
                      href="/dados"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-acid accent-link"
                    >
                      Ir para a Central de dados
                      {chevronIcon}
                    </Link>
                  }
                />
              )}
            </section>

            <section className="panel">
              <SectionHeading
                eyebrow="Atenção imediata"
                title="Alertas do dia"
                aside={
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-acid text-sm font-bold text-ink">
                    {alerts.length}
                  </span>
                }
              />

              {alerts.length > 0 ? (
                <>
                  <ul className="mt-5 space-y-3">
                    {alerts.map((alert) => (
                      <li
                        key={alert.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-acid">
                          <span className="size-1.5 rounded-full bg-acid" />
                          {alert.badge}
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {alert.description}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/estoque"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-acid accent-link"
                  >
                    Ver todos os alertas
                    {chevronIcon}
                  </Link>
                </>
              ) : (
                <EmptyState
                  icon={checkIcon}
                  title="Tudo certo por aqui"
                  description="Nenhum alerta para hoje. Quando algo precisar de atenção, ele aparece aqui."
                />
              )}
            </section>

            <section className="panel">
              <SectionHeading
                eyebrow="Reposição inteligente"
                title="O que comprar hoje"
              />

              {replenishment.length > 0 ? (
                <ul className="mt-5 divide-y divide-white/10">
                  {replenishment.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-semibold">{item.product}</p>
                        <p className="text-xs text-muted">{item.actionTime}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {item.suggestedQty}
                        </p>
                        <p className="text-[10px] text-muted">sugestão</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={boxIcon}
                  title="Nada para repor hoje"
                  description="Seu estoque está em dia. As sugestões de compra aparecem aqui quando forem necessárias."
                />
              )}
            </section>

            {data.opportunity && (
              <section className="relative overflow-hidden rounded-3xl bg-acid p-6 text-ink">
                <span className="absolute -right-12 -top-12 size-44 rounded-full bg-black/[0.07]" />
                <span className="absolute -right-4 -top-4 size-28 rounded-full bg-acid" />

                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                    <Icon size={14}>{sparklesPaths}</Icon>
                    Oportunidade
                  </span>

                  <h2 className="mt-4 font-display text-2xl font-semibold leading-tight">
                    {data.opportunity.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink/70">
                    {data.opportunity.description}
                  </p>

                  <Link
                    href="/promocoes"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    Simular promoção
                    {chevronIcon}
                  </Link>
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </main>
  );
}