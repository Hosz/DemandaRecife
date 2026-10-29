"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    
    if (!storedName) {
      router.push("/onboarding");
    } else {
      setUserName(storedName);
    }
  }, [router]);

  if (!userName) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-lime-400 mb-2">
          <span className="inline-block h-2 w-2 rounded-full bg-lime-400 animate-pulse"></span>
          <span>Briefing atualizado às 07:30</span>
        </div>

        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl text-white">
          Bom dia, {userName}.
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Hoje promete ser movimentado. Aqui está o que merece sua atenção.
        </p>
      </header>
    </main>
  );
}