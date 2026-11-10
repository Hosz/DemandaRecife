"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registra erro em console para depuração
    console.error("Erro capturado pelo Error Boundary:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="panel w-full space-y-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-red-500/10 text-xl font-bold text-red-400 mx-auto">
          !
        </span>
        <p className="eyebrow text-red-400">Ocorreu um imprevisto</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
          Algo deu errado ao carregar esta página
        </h1>
        <p className="text-sm text-muted">
          {error?.message || "Ocorreu uma falha inesperada na interface."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="primary-button sm:w-auto px-6"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
