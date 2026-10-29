"use client";

import { OnboardingWizard } from "../components/OnboardingWizard";
import { useToast } from "../components/ToastProvider";
import { submitOnboarding } from "../lib/api";

export default function OnboardingPage() {
  const { showToast } = useToast();

  async function handleOnboardingSubmit(data: any) {
    const result = await submitOnboarding(data);
    showToast(result.ok ? "success" : "error", result.message);
    return result.ok;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 sm:mb-8 text-center">
        <p className="eyebrow">Configuração Inicial</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Seja bem-vindo ao DemandaRecife
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Configure o seu perfil de negócio em poucos passos para começarmos.
        </p>
      </header>

      <OnboardingWizard onSubmit={handleOnboardingSubmit} />
    </main>
  );
}