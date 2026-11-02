
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ForecastItem = {
  productId: string;
  date: string;
  quantity: number;
  method: string;
};

type Period = "today" | "week" | "month";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getField(item: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) {
      return item[key];
    }
  }
  return undefined;
}

function normalizeForecast(
  item: Record<string, unknown>,
): ForecastItem | null {
  const productId = getField(item, ["productId", "produtoId"]);
  const date = getField(item, ["date", "data"]);
  const quantity = getField(item, [
    "quantity",
    "forecastQuantity",
    "quantidadePrevista",
    "quantidade",
    "previsao",
  ]);
  const method = getField(item, ["method", "metodo"]);

  if (
    typeof productId !== "string" &&
    typeof productId !== "number"
  ) {
    return null;
  }

  if (typeof date !== "string" || typeof quantity !== "number") {
    return null;
  }

  return {
    productId: String(productId),
    date,
    quantity,
    method: typeof method === "string" ? method : "DESCONHECIDO",
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value);
}

function methodLabel(method: string) {
  switch (method.toUpperCase()) {
    case "HISTORICO":
      return "Histórico";
    case "BENCHMARK":
      return "Benchmark";
    case "SEM_DADOS":
      return "Sem dados";
    default:
      return method;
  }
}

function methodClass(method: string) {
  switch (method.toUpperCase()) {
    case "HISTORICO":
      return "border-acid/20 bg-acid/10 text-acid";
    case "BENCHMARK":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";
    default:
      return "border-white/10 bg-white/5 text-muted";
  }
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold text-white">
        {value}
      </p>
      <p className="mt-2 text-[11px] text-muted">{description}</p>
    </article>
  );
}

function DemandChart({ data }: { data: ForecastItem[] }) {
  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();

    data.forEach((item) => {
      const date = item.date.slice(0, 10);
      grouped.set(date, (grouped.get(date) ?? 0) + item.quantity);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Nenhuma previsão disponível para este período.
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map(([, value]) => value), 1);

  const points = chartData.map(([date, value], index) => {
    const x =
      chartData.length === 1
        ? 50
        : 8 + (index / (chartData.length - 1)) * 84;

    const y = 88 - (value / maxValue) * 72;

    return { date, value, x, y };
  });

  const line = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="pt-4">
      <div className="mb-3 flex justify-between text-[10px] text-muted">
        <span>Quantidade prevista</span>
        <span>Por dia</span>
      </div>

      <svg
        viewBox="0 0 100 100"
        className="h-64 w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico de quantidade prevista por data"
      >
        {[16, 40, 64, 88].map((y) => (
          <line
            key={y}
            x1="5"
            x2="95"
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.10)"
            strokeDasharray="1.5 2"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <polygon
          points={`8,88 ${line} 92,88`}
          fill="rgba(214,255,0,0.10)"
        />

        <polyline
          points={line}
          fill="none"
          stroke="#d6ff00"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point) => (
          <circle
            key={point.date}
            cx={point.x}
            cy={point.y}
            r="1.7"
            fill="#d6ff00"
            stroke="#121212"
            strokeWidth="0.7"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="mt-2 flex justify-between gap-2">
        {points.map((point) => (
          <div key={point.date} className="min-w-0 text-center">
            <p className="truncate text-[9px] text-muted">
              {formatDate(point.date).slice(0, 5)}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-white">
              {formatNumber(point.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PrevisoesPage() {
  const router = useRouter();

  const [period, setPeriod] = useState<Period>("week");
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [today, setToday] = useState<Date | null>(null);

  const loadForecasts = useCallback(async () => {
    setLoading(true);
    setError("");

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

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");

        router.push("/onboarding");
        return;
      }

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "O endpoint de previsões não foi encontrado no backend."
            : `Não foi possível carregar as previsões. Erro HTTP ${response.status}.`,
        );
      }

      const result: unknown = await response.json();

      if (!Array.isArray(result)) {
        throw new Error(
          "A resposta da API está em um formato inesperado.",
        );
      }

      const normalized = result
        .map((item) =>
          item && typeof item === "object"
            ? normalizeForecast(item as Record<string, unknown>)
            : null,
        )
        .filter(
          (item): item is ForecastItem => item !== null,
        );

      setForecasts(normalized);

      if (normalized.length === 0 && result.length > 0) {
        setError(
          "A API retornou dados, mas nenhum registro corresponde ao formato esperado.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao carregar previsões.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userName = localStorage.getItem("user_name");

    if (!token || !userName) {
      router.push("/onboarding");
      return;
    }

    setToday(startOfDay(new Date()));
    void loadForecasts();
  }, [loadForecasts, router]);

  const filteredForecasts = useMemo(() => {
    if (!today) return [];

    return forecasts.filter((item) => {
      const date = new Date(`${item.date.slice(0, 10)}T12:00:00`);

      if (Number.isNaN(date.getTime())) return false;

      const difference =
        (startOfDay(date).getTime() - today.getTime()) / 86400000;

      if (period === "today") return difference === 0;

      if (period === "week") {
        return difference >= 0 && difference < 7;
      }

      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear() &&
        difference >= 0
      );
    });
  }, [forecasts, period, today]);

  const totalQuantity = filteredForecasts.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const productCount = new Set(
    filteredForecasts.map((item) => item.productId),
  ).size;

  const historyCount = filteredForecasts.filter(
    (item) => item.method.toUpperCase() === "HISTORICO",
  ).length;

  const periodLabel =
    period === "today"
      ? "hoje"
      : period === "week"
        ? "nos próximos 7 dias"
        : "neste mês";

  return (
    <main className="min-h-screen bg-ink px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Motor preditivo</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Previsões
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Acompanhe as estimativas de demanda e planeje as próximas
              decisões do seu negócio.
            </p>
          </div>

          <button
            type="button"
            onClick={loadForecasts}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "Atualizando..." : "↻ Atualizar previsões"}
          </button>
        </header>

        <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">
              Visão do período
            </h2>
            <p className="mt-1 text-xs text-muted">
              Resultados {periodLabel}
            </p>
          </div>

          <div className="flex rounded-xl border border-white/10 bg-white/[0.035] p-1">
            {(
              [
                ["today", "Hoje"],
                ["week", "Semana"],
                ["month", "Mês"],
              ] as [Period, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  period === value
                    ? "bg-acid text-ink"
                    : "text-muted hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={loadForecasts}
              className="text-xs font-bold text-white underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Quantidade prevista"
            value={loading ? "—" : formatNumber(totalQuantity)}
            description="Unidades estimadas no período"
          />
          <MetricCard
            label="Produtos analisados"
            value={loading ? "—" : String(productCount)}
            description="Produtos com previsão disponível"
          />
          <MetricCard
            label="Previsões históricas"
            value={loading ? "—" : String(historyCount)}
            description="Estimativas baseadas no histórico"
          />
          <MetricCard
            label="Acurácia do modelo"
            value="—"
            description="Indicador ainda não fornecido pela API"
          />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div>
              <p className="eyebrow">Demanda</p>
              <h2 className="section-title">Curva de demanda</h2>
              <p className="mt-1 text-xs text-muted">
                Quantidade total prevista por data
              </p>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted">
                Carregando previsões...
              </div>
            ) : (
              <DemandChart data={filteredForecasts} />
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <p className="eyebrow">Contexto</p>
            <h2 className="section-title">Impactos considerados</h2>
            <p className="mt-1 text-xs text-muted">
              Informações disponíveis para análise
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  title: "Histórico de vendas",
                  description: "Base utilizada pelo motor preditivo.",
                  status: "Disponível",
                  active: true,
                },
                {
                  title: "Clima",
                  description: "Dados meteorológicos não integrados.",
                  status: "Indisponível",
                  active: false,
                },
                {
                  title: "Eventos especiais",
                  description: "Calendário de eventos não integrado.",
                  status: "Indisponível",
                  active: false,
                },
                {
                  title: "Horário de pico",
                  description: "A API não fornece previsão por hora.",
                  status: "Indisponível",
                  active: false,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start justify-between gap-3 border-b border-white/10 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${
                      item.active
                        ? "bg-acid/10 text-acid"
                        : "bg-white/5 text-muted"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5 sm:px-6">
            <div>
              <p className="eyebrow">Detalhamento</p>
              <h2 className="section-title">Previsão por produto</h2>
              <p className="mt-1 text-xs text-muted">
                Estimativas retornadas pelo motor preditivo
              </p>
            </div>

            <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-muted">
              {filteredForecasts.length} registros
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-muted">
              Carregando dados...
            </div>
          ) : filteredForecasts.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-white">
                Nenhuma previsão encontrada
              </p>
              <p className="mt-2 text-xs text-muted">
                Não existem previsões disponíveis para o período selecionado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-muted">
                    <th className="px-6 py-4 font-semibold">Produto</th>
                    <th className="px-6 py-4 font-semibold">Data</th>
                    <th className="px-6 py-4 font-semibold">
                      Quantidade prevista
                    </th>
                    <th className="px-6 py-4 font-semibold">Método</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filteredForecasts.map((item, index) => (
                    <tr
                      key={`${item.productId}-${item.date}-${index}`}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-white">
                          Produto
                        </p>
                        <p className="mt-1 text-[10px] text-muted">
                          ID: {item.productId}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-display text-sm font-bold text-white">
                          {formatNumber(item.quantity)} un.
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${methodClass(item.method)}`}
                        >
                          {methodLabel(item.method)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-white/10 px-5 py-3 sm:px-6">
            <p className="text-[10px] text-muted">
              Os resultados dependem do histórico disponível e do método
              utilizado pelo motor preditivo.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
