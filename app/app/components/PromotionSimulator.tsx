"use client";

import { useMemo, useState } from "react";
import {
  SAMPLE_PRODUCTS,
  marginLevel,
  simulatePromotion,
  type MarginLevel,
  type SampleProduct,
} from "../lib/promotions";

type Mode = "desconto" | "preco";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const pct = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function fmtBrl(value: number | null) {
  return value === null ? "—" : brl.format(value);
}

function fmtPct(value: number | null) {
  return value === null ? "—" : `${pct.format(value)}%`;
}

const LEVEL_STYLE: Record<
  MarginLevel,
  { text: string; badge: string; label: string }
> = {
  saudavel: {
    text: "text-acid",
    badge: "bg-acid/15 text-acid",
    label: "Margem saudável",
  },
  risco: {
    text: "text-amber-300",
    badge: "bg-amber-500/15 text-amber-300",
    label: "Margem em risco",
  },
  prejuizo: {
    text: "text-red-400",
    badge: "bg-red-500/15 text-red-300",
    label: "Prejuízo",
  },
};

function modeButtonClass(active: boolean) {
  return `min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
    active
      ? "border-acid bg-acid text-ink"
      : "border-white/10 text-white hover:border-acid"
  }`;
}

function ResultCard({
  label,
  value,
  valueClass = "text-white",
  hint,
  className = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`panel p-4 sm:p-6 ${className}`}>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p
        className={`mt-2 font-display text-xl font-semibold sm:text-2xl ${valueClass}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function PromotionSimulator() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SampleProduct | null>(null);
  const [mode, setMode] = useState<Mode>("desconto");
  const [value, setValue] = useState("");
  const [confirmed, setConfirmed] = useState<number | null>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SAMPLE_PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const numeric = useMemo(() => {
    if (value.trim() === "") return null;
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }, [value]);

  const inputError =
    selected && numeric !== null
      ? mode === "desconto" && numeric > 100
        ? "O desconto não pode passar de 100%."
        : mode === "preco" && numeric > selected.price
          ? `O preço final não pode ser maior que o preço atual (${fmtBrl(selected.price)}).`
          : null
      : null;

  const result = useMemo(() => {
    if (!selected) return null;
    if (numeric === null || inputError) return simulatePromotion(selected, {});
    return simulatePromotion(
      selected,
      mode === "desconto"
        ? { discountPercentage: numeric }
        : { targetPrice: numeric },
    );
  }, [selected, mode, numeric, inputError]);

  const newMargin = result ? result.novaMargemPercentual : null;
  const level = newMargin !== null ? marginLevel(newMargin) : null;
  const levelStyle = level ? LEVEL_STYLE[level] : null;

  // O aviso vermelho só aparece depois de confirmar o número (sair do campo ou Enter).
  const showBlock =
    level === "prejuizo" &&
    numeric !== null &&
    confirmed === numeric &&
    !inputError;

  function confirmValue() {
    setConfirmed(inputError ? null : numeric);
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    setSelected(null);
    setValue("");
    setConfirmed(null);
  }

  function handleSelect(product: SampleProduct) {
    setSelected(product);
    setQuery(product.name);
    setValue("");
    setConfirmed(null);
  }

  function handleModeChange(next: Mode) {
    setMode(next);
    setValue("");
    setConfirmed(null);
  }

  function handleValueChange(next: string) {
    setValue(next);
    setConfirmed(null);
  }

  function applyMaxDiscount() {
    if (!result) return;
    setMode("desconto");
    setValue(
      String(Math.floor(result.descontoMaximoPercentual * 10) / 10).replace(
        ".",
        ",",
      ),
    );
    setConfirmed(null);
  }

  function clearSimulation() {
    setValue("");
    setConfirmed(null);
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <section className="panel space-y-5">
          <div>
            <label htmlFor="product-search" className="field-label">
              Produto
            </label>
            <input
              id="product-search"
              type="text"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Ex.: café"
              autoComplete="off"
              className="field"
            />

            {!selected && suggestions.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {suggestions.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(product)}
                      className="flex min-h-11 w-full items-center justify-between rounded-xl border border-white/10 px-4 py-2 text-left text-sm text-white transition hover:border-acid"
                    >
                      <span>{product.name}</span>
                      <span className="text-muted">{fmtBrl(product.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {!selected && query.trim() !== "" && suggestions.length === 0 ? (
              <p className="mt-2 text-xs text-muted">
                Nenhum produto encontrado.
              </p>
            ) : null}
          </div>

          <div>
            <p className="field-label">Simular por</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={mode === "desconto"}
                onClick={() => handleModeChange("desconto")}
                className={modeButtonClass(mode === "desconto")}
              >
                Desconto (%)
              </button>
              <button
                type="button"
                aria-pressed={mode === "preco"}
                onClick={() => handleModeChange("preco")}
                className={modeButtonClass(mode === "preco")}
              >
                Preço final (R$)
              </button>
            </div>
          </div>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              confirmValue();
            }}
          >
            <div>
              <label htmlFor="sim-value" className="field-label">
                {mode === "desconto"
                  ? "Desconto desejado (%)"
                  : "Novo preço final (R$)"}
              </label>
              <input
                id="sim-value"
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(event) => handleValueChange(event.target.value)}
                onBlur={confirmValue}
                placeholder={mode === "desconto" ? "Ex.: 15" : "Ex.: 18,90"}
                disabled={!selected}
                className="field disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {inputError ? (
              <p role="alert" className="text-sm font-semibold text-red-400">
                {inputError}
              </p>
            ) : null}

            {newMargin !== null && levelStyle ? (
              <p className={`text-sm font-semibold ${levelStyle.text}`}>
                Nova margem: {fmtPct(newMargin)} · {levelStyle.label}
              </p>
            ) : null}

            <p className="text-xs text-muted">
              Os valores aparecem enquanto você digita. Se a promoção der
              prejuízo, o aviso aparece quando você sair do campo.
            </p>
          </form>
        </section>

        <section>
          {!result ? (
            <div className="panel">
              <p className="text-sm text-muted">
                Escolha um produto para ver o limite de desconto e simular uma
                promoção.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {levelStyle ? (
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelStyle.badge}`}
                >
                  {levelStyle.label}
                </span>
              ) : null}

              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                <ResultCard
                  className="col-span-2 lg:col-span-1"
                  label="Nova margem de lucro"
                  value={fmtPct(result.novaMargemPercentual)}
                  valueClass={levelStyle ? levelStyle.text : "text-white"}
                  hint={
                    result.novaMargemPercentual === null
                      ? `Margem atual: ${fmtPct(result.margemAtualPercentual)}`
                      : undefined
                  }
                />
                <ResultCard
                  label="Novo preço"
                  value={fmtBrl(result.novoPreco)}
                />
                <ResultCard
                  label="Lucro por unidade"
                  value={fmtBrl(result.lucroUnitario)}
                  valueClass={
                    result.lucroUnitario !== null && result.lucroUnitario < 0
                      ? "text-red-400"
                      : "text-white"
                  }
                />
                <ResultCard
                  label="Preço original"
                  value={fmtBrl(result.precoAtual)}
                />
                <ResultCard
                  label="Custo do produto"
                  value={fmtBrl(result.custo)}
                />
                <ResultCard
                  className="col-span-2 lg:col-span-1"
                  label="Desconto máximo permitido"
                  value={fmtPct(result.descontoMaximoPercentual)}
                  hint="Acima disso o preço fica abaixo do custo."
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {result && showBlock ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="loss-title"
          className="fixed inset-0 z-50 grid place-items-center bg-red-950/90 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-red-400/40 bg-ink p-6 text-center">
            <p
              id="loss-title"
              className="font-display text-xl font-semibold text-red-400"
            >
              Atenção: essa promoção dá prejuízo
            </p>
            <p className="mt-2 text-sm text-muted">
              Com esse desconto o preço fica abaixo do custo e cada unidade
              vendida perde {fmtBrl(Math.abs(result.lucroUnitario ?? 0))}. O
              desconto máximo para não ter prejuízo é{" "}
              {fmtPct(result.descontoMaximoPercentual)}.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={applyMaxDiscount}
                className="primary-button"
              >
                Usar o desconto máximo
              </button>
              <button
                type="button"
                onClick={clearSimulation}
                className="min-h-11 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Limpar simulação
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}