"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "../components/ToastProvider";
import { registerUser, loginUser } from "../lib/api";
import { isAuthenticated, getTenantId } from "../lib/auth";

export default function CadastroPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [nome, setNome] = useState("");
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

    if (!nome.trim() || !email.trim() || !senha) {
      showToast("error", "Por favor, preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      showToast("error", "A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const regResult = await registerUser({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
      });

      if (!regResult.ok) {
        showToast("error", regResult.message);
        setLoading(false);
        return;
      }

      // Autentica automaticamente após o cadastro bem-sucedido
      const loginResult = await loginUser({
        email: email.trim().toLowerCase(),
        senha,
      });

      if (!loginResult.ok) {
        showToast(
          "success",
          "Conta criada com sucesso! Faça login para continuar.",
        );
        router.replace("/login");
        return;
      }

      showToast("success", "Conta criada! Vamos configurar o seu negócio.");
      router.replace("/onboarding");
    } catch {
      showToast(
        "error",
        "Ocorreu um erro ao criar a conta. Tente novamente.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-acid font-display text-2xl font-bold text-ink">
          D
        </div>
        <p className="eyebrow">Criar nova conta</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Comece com o DemandaRecife
        </h1>
        <p className="mt-2 text-sm text-muted">
          Cadastre seu perfil de gestor para calibrar previsões e gerenciar demandas locais.
        </p>
      </header>

      <div className="panel">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="field-label">Seu nome completo</span>
            <input
              type="text"
              required
              autoComplete="name"
              placeholder="Ex: Marina Santos"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="field text-base"
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="field-label">Seu melhor e-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="marina@padaria.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field text-base"
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="field-label">Crie uma senha de acesso</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="Mínimo de 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="field text-base"
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !nome.trim() || !email.trim() || senha.length < 6}
            className="primary-button mt-2"
          >
            {loading ? "Cadastrando..." : "Criar conta e continuar"}
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-xs text-muted">
            Já possui uma conta cadastrada?{" "}
            <Link
              href="/login"
              className="font-semibold text-acid hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
