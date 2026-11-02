
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ForecastItem = {
  productId: string;
  data: string;
  quantidadePrevista: number;
  metodo: "HISTORICO" | "BENCHMARK" | "SEM_DADOS";
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function Icon({
  type,
  size = 18,
}: {
  type: "chart" | "users" | "box" | "sparkles" | "sun" | "bell";
  size?: number;
}) {
  const paths = {
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-5 5" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    box: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 8 9 5 9-5" />
        <path d="M3 8v9l9 5 9-5V8" />
        <path d="M12 13v9" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1L19 14Z" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tag,
}: {
  icon: "chart" | "users" | "box" | "sparkles";
  label: string;
  value: string;
  detail: string;
  tag?: string;
}) {
  return (
    <section className="panel min-w-0">
      <div className="mb-5 flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-acid">
          <Icon type={icon} />
        </span>
        {tag && (
          <span className="rounded-full bg-acid/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-acid">
            {tag}
          </span>
        )}
      </div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 break-words font-display text-2xl font-bold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted">{detail}</p>
    </section>
  );
}

const demoAlerts = [
  {
    id: 1,
    title: "Estoque crítico",
    description: "Leite integral 1L",
    detail: "5 unidades restantes",
    priority: "Crítico",
    color: "bg-red-500",
    textColor: "text-red-400",
  },
  {
    id: 2,
    title: "Demanda alta",
    description: "Pão francês",
    detail: "35% acima do habitual",
    priority: "Atenção",
    color: "bg-amber-400",
    textColor: "text-amber-400",
  },
  {
    id: 3,
    title: "Reposição sugerida",
    description: "Café 500g",
    detail: "Considere repor hoje",
    priority: "Sugestão",
    color: "bg-acid",
    textColor: "text-acid",
  },
];

export default function Home() {
  const router = useRouter();

  const [userName, setUserName] = useState<string | null>(null);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedName = localStorage.getItem("user_name");

    if (!token || !storedName) {
      router.push("/onboarding");
      return;
    }

    setUserName(storedName);
  }, [router]);

  useEffect(() => {
    async function loadForecast() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          router.push("/onboarding");
          return;
        }

        const response = await fetch(`${API_URL}/api/forecast`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user_name");
            localStorage.removeItem("user_email");
            router.push("/onboarding");
            return;
          }

          throw new Error("Não foi possível consultar a previsão.");
        }

        const data: ForecastItem[] = await response.json();
        setForecasts(data);
        setApiError(false);
      } catch (error) {
        console.error("Erro ao carregar previsão:", error);
        setApiError(true);
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, [router]);

  if (!userName) return null;

  const totalForecast = forecasts.reduce(
    (total, item) => total + Number(item.quantidadePrevista || 0),
    0
  );

  const productsWithData = forecasts.filter(
    (item) => item.metodo !== "SEM_DADOS"
  ).length;

  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? "Bom dia"
      : currentHour < 18
        ? "Boa tarde"
        : "Boa noite";

  const updatedAt = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
      <header className="mb-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Visão geral do negócio
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("open-notifications"))
              }
              aria-label="Abrir notificações"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/10"
            >
              <Icon type="bell" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-acid" />
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-quick-entry"))}
              className="rounded-xl bg-acid px-4 py-3 text-xs font-bold text-ink transition hover:brightness-90"
            >
              + Nova entrada
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-acid">
              <span className="h-2 w-2 animate-pulse rounded-full bg-acid" />
              Briefing atualizado às {updatedAt}
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {greeting}, {userName}.
            </h1>

            <p className="mt-2 max-w-xl text-sm text-muted">
              Hoje promete ser movimentado. Aqui está o que merece sua atenção.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
            <span className="text-acid">
              <Icon type="sun" size={23} />
            </span>
            <div>
              <p className="text-xs font-semibold text-white">
                Clima indisponível
              </p>
              <p className="text-[10px] text-muted">
                Dados meteorológicos não carregados
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon="chart"
          label="Demanda prevista"
          value={
            loading
              ? "..."
              : apiError
                ? "Indisponível"
                : `${totalForecast.toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })} un.`
          }
          detail={
            apiError
              ? "Não foi possível consultar a API"
              : "Quantidade estimada para hoje"
          }
          tag="Previsão"
        />

        <MetricCard
          icon="users"
          label="Pico de movimento"
          value="—"
          detail="Dados por horário indisponíveis"
          tag="Movimento"
        />

        <MetricCard
          icon="box"
          label="Alertas de estoque"
          value="—"
          detail="Dados de estoque não disponíveis"
          tag="Atenção"
        />

        <MetricCard
          icon="sparkles"
          label="Precisão do modelo"
          value="—"
          detail={
            apiError
              ? "API indisponível"
              : `${productsWithData} produtos com previsão calculada`
          }
          tag="Modelo"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="panel">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Previsão de hoje</p>
              <h2 className="section-title">Fluxo de clientes</h2>
            </div>
            <button
              type="button"
              onClick={() => router.push("/previsões")}
              className="text-xs font-bold text-acid hover:underline"
            >
              Ver análise
            </button>
          </div>

          <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-acid">
              <Icon type="chart" size={22} />
            </span>
            <p className="text-sm font-semibold text-white">
              Gráfico por horário ainda indisponível
            </p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">
              A API atual fornece previsões por produto e por dia, mas não
              fornece a distribuição do movimento ao longo das horas.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-xs text-muted">
              {loading
                ? "Consultando previsão..."
                : apiError
                  ? "Não foi possível carregar a previsão."
                  : `${forecasts.length} produtos encontrados na previsão.`}
            </p>
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[10px] text-muted">
              {apiError ? "Sem conexão" : "Previsão diária"}
            </span>
          </div>
        </section>

        <section className="panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Atenção imediata</p>
              <h2 className="section-title">Alertas do dia</h2>
            </div>

            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-acid px-2 text-xs font-bold text-ink">
              {demoAlerts.length}
            </span>
          </div>

          <div className="space-y-2">
            {demoAlerts.map((alert) => (
              <article
                key={alert.id}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 transition hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${alert.color}`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white">
                        {alert.title}
                      </p>

                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${alert.textColor}`}
                      >
                        {alert.priority}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-white">
                      {alert.description}
                    </p>

                    <p className="mt-1 text-[10px] text-muted">
                      {alert.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-[10px] text-muted">
              Dados demonstrativos
            </span>

            <button
              type="button"
              onClick={() => router.push("/estoque")}
              className="text-xs font-bold text-acid transition hover:underline"
            >
              Ver todos os alertas →
            </button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="panel">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Reposição inteligente</p>
              <h2 className="section-title">O que comprar hoje</h2>
            </div>
            <button
              type="button"
              onClick={() => router.push("/estoque")}
              className="text-xs font-bold text-acid hover:underline"
            >
              Ver estoque
            </button>
          </div>

          <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-white">
              Reposição ainda não calculada
            </p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">
              Para recomendar compras, precisamos cruzar a previsão de vendas
              com as quantidades disponíveis em estoque.
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-acid p-6 text-ink sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[24px] border-black/[0.06]" />

          <div className="relative">
            <span className="mb-5 inline-flex rounded-full bg-black px-3 py-1 text-[10px] font-bold text-white">
              ✦ Oportunidade
            </span>

            <h2 className="max-w-sm font-display text-2xl font-bold leading-tight sm:text-3xl">
              Uma promoção pode salvar sua margem.
            </h2>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-black/70">
              Simule uma campanha para avaliar oportunidades de venda e
              melhorar seus resultados.
            </p>

            <button
              type="button"
              onClick={() => router.push("/promoções")}
              className="mt-6 rounded-xl bg-black px-5 py-3 text-xs font-bold text-white transition hover:bg-black/80"
            >
              Simular promoção →
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
