"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "../components/ToastProvider";
import { loginUser } from "../lib/api";
import { isAuthenticated, getTenantId } from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      if (getTenantId()) {
        router.replace("/");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !senha) {
      showToast("error", "Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({ email: email.trim(), senha });

      if (!result.ok) {
        showToast("error", result.message);
        setLoading(false);
        return;
      }

      showToast("success", "Login realizado com sucesso!");

      if (result.session?.tenantId) {
        router.replace("/");
      } else {
        router.replace("/onboarding");
      }
    } catch {
      showToast("error", "Ocorreu um erro ao tentar entrar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-acid font-display text-2xl font-bold text-ink">
          D
        </div>
        <p className="eyebrow">Acesso à plataforma</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Entrar no DemandaRecife
        </h1>
        <p className="mt-2 text-sm text-muted">
          Previsão inteligente e gestão de demanda para o seu negócio no Recife.
        </p>
      </header>

      <div className="panel">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="field-label">E-mail corporativo ou pessoal</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="exemplo@padaria.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field text-base"
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="field-label">Senha</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="field text-base"
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !email.trim() || !senha}
            className="primary-button mt-2"
          >
            {loading ? "Entrando..." : "Entrar na plataforma"}
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-xs text-muted">
            Ainda não possui conta?{" "}
            <Link
              href="/cadastro"
              className="font-semibold text-acid hover:underline"
            >
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
