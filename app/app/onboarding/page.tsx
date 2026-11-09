"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "../components/OnboardingWizard";
import { useToast } from "../components/ToastProvider";
import { submitOnboarding, type OnboardingData } from "../lib/api";
import { isAuthenticated, getTenantId } from "../lib/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    if (getTenantId()) {
      router.replace("/");
    }
  }, [router]);

  async function handleOnboardingSubmit(data: OnboardingData) {
    const result = await submitOnboarding(data);
    showToast(result.ok ? "success" : "error", result.message);
    return result.ok;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 text-center sm:mb-8">
        <p className="eyebrow">Configuração do estabelecimento</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Seja bem-vindo ao DemandaRecife
        </h1>
        <p className="mt-2 text-sm text-muted">
          Configure o perfil do seu negócio no Recife para calibrarmos a inteligência de demanda.
        </p>
      </header>

      <OnboardingWizard onSubmit={handleOnboardingSubmit} />
    </main>
  );
}
