"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import {
  BRIEFING_LIST_LIMIT,
  fetchDailyBriefing,
  type BriefingForecast,
  type DailyBriefingData,
} from "./lib/dashboard";

const quantityFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

const ALERT_LABELS: Record<string, string> = {
  RUPTURA_ESTOQUE: "Ruptura de estoque",
  ESTOQUE_BAIXO: "Estoque baixo",
};

const PRIORITY_LABELS: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readUserName(): string | null | undefined {
  return localStorage.getItem("user_name");
}

function readUserNameOnServer(): string | null | undefined {
  return undefined;
}

function formatQuantity(value: number) {
  return quantityFormat.format(value);
}

function capped(count: number) {
  return count >= BRIEFING_LIST_LIMIT ? `${count}+` : String(count);
}

function humanize(value: string) {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDay(iso: string) {
  if (!iso) return "hoje";

  const date = new Date(`${iso}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "hoje";

  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

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

const barsIcon = (
  <Icon>
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
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

const sparklesIcon = (
  <Icon>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </Icon>
);

const alertIcon = (
  <Icon>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
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
  badge?: string;
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
        {badge && (
          <span className="rounded-full bg-acid/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-acid">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-6 text-xs text-muted">{label}</p>
      <p className="mt-1 truncate font-display text-3xl font-semibold tracking-tight">
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

function BlockError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center">
      <p className="text-sm font-semibold">Não foi possível carregar este bloco</p>
      <p className="mt-1 text-xs text-muted">
        Os outros blocos continuam disponíveis.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 text-sm font-semibold text-acid accent-link"
      >
        Tentar de novo
      </button>
    </div>
  );
}

function ForecastBars({ items }: { items: BriefingForecast[] }) {
  const max = Math.max(...items.map((item) => item.quantidadePrevista), 1);

  return (
    <ul className="mt-5 space-y-4">
      {items.map((item, index) => (
        <li key={item.productId}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-semibold">
              {item.produto}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatQuantity(item.quantidadePrevista)} un.
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.quantidadePrevista / max) * 100}%`,
                background:
                  index === 0
                    ? "#d6ff00"
                    : "linear-gradient(to right, #3b4600, #d6ff00)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function InicioPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [data, setData] = useState<DailyBriefingData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const userName = useSyncExternalStore(
    subscribeToStorage,
    readUserName,
    readUserNameOnServer,
  );

  useEffect(() => {
    if (userName === undefined) return;

    if (userName === null) {
      router.replace("/onboarding");
      return;
    }

    let cancelled = false;

    async function run() {
      const result = await fetchDailyBriefing();

      if (cancelled) return;

      setLoadedAt(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );

      if (result.ok) {
        setData(result.data);
        setStatus("ready");
        return;
      }

      setErrorMessage(result.message);
      setStatus("error");
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [userName, attempt, router]);

  function handleRetry() {
    setStatus("loading");
    setAttempt((current) => current + 1);
  }

  const forecast = data
    ? [...data.previsaoVendas].sort(
        (a, b) => b.quantidadePrevista - a.quantidadePrevista,
      )
    : [];
  const purchases = data?.compras ?? [];
  const alerts = data?.alertas ?? [];
  const failed = data?.secoesComFalha ?? [];
  const forecastFailed = failed.includes("previsaoVendas");
  const purchasesFailed = failed.includes("compras");
  const alertsFailed = failed.includes("alertas");
  const leader = forecast[0];
  const forecastTotal = forecast.reduce(
    (sum, item) => sum + item.quantidadePrevista,
    0,
  );
  const highAlerts = alerts.filter((alert) => alert.prioridade === "ALTA").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 sm:mb-8">
        {status === "ready" && loadedAt && (
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-acid">
            <span className="block size-2 animate-pulse rounded-full bg-acid" />
            Briefing atualizado às {loadedAt}
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          {userName ? `Bom dia, ${userName}.` : "Bom dia."}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-base">
          {status === "ready" && data
            ? `Resumo de ${formatDay(data.data)}: o que vender, o que comprar e o que merece atenção.`
            : "Aqui está o resumo do seu dia: o que vender, o que comprar e o que merece atenção."}
        </p>
      </header>

      {status === "loading" && <DashboardSkeleton />}

      {status === "error" && (
        <section className="panel text-center">
          <p className="section-title">Não foi possível carregar o briefing</p>
          <p className="mt-2 text-sm text-muted">{errorMessage}</p>
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={sparklesIcon}
              label="Produto líder"
              value={forecastFailed ? "-" : leader ? leader.produto : "Sem previsão"}
              caption={
                forecastFailed
                  ? "não foi possível carregar"
                  : leader
                    ? `${formatQuantity(leader.quantidadePrevista)} un. previstas hoje`
                    : "registre vendas para começar"
              }
            />
            <MetricCard
              icon={barsIcon}
              label="Vendas previstas"
              value={
                forecastFailed ? "-" : `${formatQuantity(forecastTotal)} un.`
              }
              caption={
                forecastFailed
                  ? "não foi possível carregar"
                  : forecast.length > 0
                    ? `soma dos ${forecast.length} produtos líderes`
                    : "nenhum produto com previsão"
              }
            />
            <MetricCard
              icon={boxIcon}
              badge={!purchasesFailed && purchases.length > 0 ? "Atenção" : undefined}
              label="Itens para comprar"
              value={purchasesFailed ? "-" : capped(purchases.length)}
              caption={
                purchasesFailed
                  ? "não foi possível carregar"
                  : purchases.length > 0
                    ? "precisam de reposição agora"
                    : "estoque em dia"
              }
            />
            <MetricCard
              icon={alertIcon}
              badge={!alertsFailed && highAlerts > 0 ? "Alta" : undefined}
              label="Alertas ativos"
              value={alertsFailed ? "-" : capped(alerts.length)}
              caption={
                alertsFailed
                  ? "não foi possível carregar"
                  : highAlerts > 0
                    ? `${highAlerts} de prioridade alta`
                    : "nenhum de prioridade alta"
              }
            />
          </div>

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            <section className="panel lg:col-span-2">
              <SectionHeading
                eyebrow="Previsão de hoje"
                title="Top vendas de hoje"
              />

              {forecastFailed ? (
                <BlockError onRetry={handleRetry} />
              ) : forecast.length > 0 ? (
                <ForecastBars items={forecast} />
              ) : (
                <EmptyState
                  icon={barsIcon}
                  title="Ainda não há previsão para hoje"
                  description="Registre algumas vendas para o sistema começar a prever as vendas dos seus produtos."
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
                eyebrow="Atenção"
                title="Reposição de estoque"
              />

              {purchasesFailed ? (
                <BlockError onRetry={handleRetry} />
              ) : purchases.length > 0 ? (
                <>
                  <ul className="mt-5 divide-y divide-white/10">
                    {purchases.map((item) => (
                      <li
                        key={item.productId}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {item.produto}
                          </p>
                          <p className="text-xs text-muted">
                            Estoque {item.estoqueAtual} · mínimo{" "}
                            {item.estoqueMinimo}
                            {item.metodo === "PADRAO"
                              ? " · sugestão padrão"
                              : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">
                            {item.quantidadeSugerida} un.
                          </p>
                          <p className="text-[10px] text-muted">sugestão</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/compras"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-acid accent-link"
                  >
                    Ver lista de compras
                    {chevronIcon}
                  </Link>
                </>
              ) : (
                <EmptyState
                  icon={checkIcon}
                  title="Nada para repor agora"
                  description="Seu estoque está em dia. Quando algum item precisar de reposição, ele aparece aqui."
                />
              )}
            </section>

            <section className="panel">
              <SectionHeading
                eyebrow="Atenção imediata"
                title="Alertas operacionais"
                aside={
                  !alertsFailed ? (
                    <span className="grid h-8 min-w-8 shrink-0 place-items-center rounded-full bg-acid px-2 text-sm font-bold text-ink">
                      {capped(alerts.length)}
                    </span>
                  ) : undefined
                }
              />

              {alertsFailed ? (
                <BlockError onRetry={handleRetry} />
              ) : alerts.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {alerts.map((alert) => (
                    <li
                      key={alert.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-acid">
                          <span className="size-1.5 rounded-full bg-acid" />
                          {ALERT_LABELS[alert.tipo] ?? humanize(alert.tipo)}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            alert.prioridade === "ALTA"
                              ? "bg-acid text-ink"
                              : "bg-acid/10 text-acid"
                          }`}
                        >
                          {PRIORITY_LABELS[alert.prioridade] ??
                            humanize(alert.prioridade)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold">{alert.titulo}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {alert.descricao}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={checkIcon}
                  title="Tudo certo por aqui"
                  description="Nenhum alerta para hoje. Quando algo precisar de atenção, ele aparece aqui."
                />
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}