"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { requestAndSubscribePush } from "../lib/push";
import { registrarVenda } from "../lib/sales-service";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
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

const homeIcon = (
  <Icon>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </Icon>
);

const forecastIcon = (
  <Icon>
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
  </Icon>
);

const stockIcon = (
  <Icon>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </Icon>
);

const teamIcon = (
  <Icon>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

const tagIcon = (
  <Icon>
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
  </Icon>
);

const databaseIcon = (
  <Icon>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    <path d="M3 12a9 3 0 0 0 18 0" />
  </Icon>
);

const cartIcon = (
  <Icon>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </Icon>
);

const settingsIcon = (
  <Icon>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

const moreIcon = (
  <Icon>
    <path d="M4 12h16" />
    <path d="M4 6h16" />
    <path d="M4 18h16" />
  </Icon>
);

const closeIcon = (
  <Icon>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);

const bellIcon = (
  <Icon>
    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
  </Icon>
);

// Notificações operacionais extraídas do Figma
const NOTIFICACOES_FIGMA = [
  "Leite pode acabar às 16h",
  "Escala precisa de reforço",
  "Promoção sugerida para iogurtes",
];

const MAIN_TABS: NavItem[] = [
  { href: "/", label: "Início", icon: homeIcon },
  { href: "/previsoes", label: "Previsões", icon: forecastIcon },
  { href: "/estoque", label: "Estoque", icon: stockIcon },
  { href: "/equipe", label: "Equipe", icon: teamIcon },
];

const MENU_ITEMS: NavItem[] = [
  { href: "/", label: "Início", icon: homeIcon },
  { href: "/previsoes", label: "Previsões", icon: forecastIcon },
  { href: "/estoque", label: "Estoque", icon: stockIcon },
  { href: "/compras", label: "Compras", icon: cartIcon },
  { href: "/equipe", label: "Equipe", icon: teamIcon },
  { href: "/promocoes", label: "Promoções", icon: tagIcon },
  { href: "/dados", label: "Dados", icon: databaseIcon },
  { href: "/configuracoes", label: "Configurações", icon: settingsIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function tabClass(active: boolean) {
  return `flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-semibold transition ${
    active ? "text-acid" : "text-muted hover:text-white"
  }`;
}

const headerButtonClass =
  "relative grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white transition hover:bg-white/10";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Estado do painel suspenso de Notificações (Figma)
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Estados do Modal "Registrar Venda"
  const [modalVendaOpen, setModalVendaOpen] = useState(false);
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [salvandoVenda, setSalvandoVenda] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Registra Service Worker / Push em background sem bloquear a UI
  useEffect(() => {
    if (typeof window !== "undefined") {
      void requestAndSubscribePush().catch(() => {});
    }
  }, []);

  // Fechamento no ESC
  useEffect(() => {
    if (!menuOpen && !modalVendaOpen && !notifOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setModalVendaOpen(false);
        setNotifOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, modalVendaOpen, notifOpen]);

  // Fechar o dropdown de notificações se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }

    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  // Manipulador de Registro de Venda (Online ou Offline via IndexedDB)
  async function handleSubmitVenda(e: React.FormEvent) {
    e.preventDefault();
    if (!produto || !quantidade || !valorTotal) return;

    setSalvandoVenda(true);
    try {
      const result = await registrarVenda({
        productId: produto,
        quantidade: Number(quantidade.replace(",", ".")),
        valorUnitario: Number(valorTotal.replace(",", ".")) / (Number(quantidade.replace(",", ".")) || 1),
        dataHora: new Date().toISOString(),
      });

      setToastMessage(
        result.offline
          ? "Salvo no modo offline! Sincronizará quando a rede voltar."
          : "Venda registrada com sucesso!",
      );
      setProduto("");
      setQuantidade("");
      setValorTotal("");
      setModalVendaOpen(false);
    } catch {
      setToastMessage("Erro ao registrar venda.");
    } finally {
      setSalvandoVenda(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  }

  const onMainTab = MAIN_TABS.some((tab) => isActive(pathname, tab.href));
  const maisActive = menuOpen || !onMainTab;

  if (pathname.startsWith("/onboarding")) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-acid/30 bg-[#16171a]/95 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur">
          {toastMessage}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            onClick={() => {
              setMenuOpen(false);
              setNotifOpen(false);
            }}
            aria-label="Ir para o início"
            className="grid size-10 place-items-center rounded-xl bg-acid font-display text-lg font-bold text-ink"
          >
            N
          </Link>

          <div className="relative flex items-center gap-2" ref={notifRef}>
            {/* Botão de Notificações com Indicador Neon Verde (Figma) */}
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setMenuOpen(false);
              }}
              aria-label="Ver notificações"
              aria-expanded={notifOpen}
              className={`${headerButtonClass} ${
                notifOpen ? "border-acid text-acid bg-acid/10" : ""
              }`}
            >
              {bellIcon}
              <span className="absolute top-2 right-2 size-2 rounded-full bg-[#d6ff00] shadow-[0_0_8px_#d6ff00]" />
            </button>

            {/* Painel Dropdown de Notificações (Figma) */}
            {notifOpen && (
              <div
                role="region"
                aria-label="Notificações"
                className="absolute right-0 top-12 z-50 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#191a1d] p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    Notificações
                  </h3>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] font-medium text-white/50 hover:text-white transition"
                  >
                    Fechar
                  </button>
                </div>

                <ul className="divide-y divide-white/5">
                  {NOTIFICACOES_FIGMA.map((item, index) => (
                    <li key={index} className="flex items-center gap-2.5 py-3 first:pt-3 last:pb-1">
                      <span className="size-2 shrink-0 rounded-full bg-[#d6ff00]" />
                      <span className="text-xs text-white/85 font-medium leading-tight">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botão Desktop: + Nova entrada */}
            <button
              type="button"
              onClick={() => {
                setModalVendaOpen(true);
                setNotifOpen(false);
              }}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-acid px-3.5 py-2.5 text-xs font-bold text-ink transition hover:brightness-105 active:scale-95 shadow-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span>Nova entrada</span>
            </button>

            {/* Botão Hambúrguer / Fechar Menu */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen((open) => !open);
                setNotifOpen(false);
              }}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="menu-principal"
              className={headerButtonClass}
            >
              {menuOpen ? closeIcon : moreIcon}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            id="menu-principal"
            className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6"
          >
            <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {MENU_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-acid text-ink"
                          : "text-white hover:bg-white/5"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </header>

      {/* Container principal com compensação para a Bottom Navigation no mobile */}
      <div className="flex flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-8">
        {children}
      </div>

      {/* Botão Flutuante Verde-Limão (+) para Registrar Venda - Exclusivo Mobile */}
      <aside aria-label="Ações rápidas" className="md:hidden">
        <button
          type="button"
          onClick={() => {
            setModalVendaOpen(true);
            setNotifOpen(false);
          }}
          aria-label="Registrar uma venda"
          className="fixed bottom-[calc(4.8rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-13 place-items-center rounded-full bg-[#d6ff00] text-[#111214] shadow-lg shadow-[#d6ff00]/25 transition hover:scale-105 active:scale-95"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </aside>

      {/* Modal Figma: ENTRADA RÁPIDA - Registrar uma venda */}
      {modalVendaOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-venda-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#16171a] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#d6ff00]">
                  Entrada Rápida
                </p>
                <h2 id="modal-venda-title" className="mt-1 font-display text-xl font-bold text-white">
                  Registrar uma venda
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalVendaOpen(false)}
                aria-label="Fechar formulário"
                className="grid size-9 place-items-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {closeIcon}
              </button>
            </div>

            <form onSubmit={handleSubmitVenda} className="mt-6 space-y-4">
              <div>
                <label htmlFor="input-produto" className="block text-xs font-medium text-white/70">
                  Produto
                </label>
                <input
                  id="input-produto"
                  type="text"
                  required
                  placeholder="Pão francês"
                  value={produto}
                  onChange={(e) => setProduto(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1f2024] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#d6ff00] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-quantidade" className="block text-xs font-medium text-white/70">
                    Quantidade
                  </label>
                  <input
                    id="input-quantidade"
                    type="text"
                    required
                    placeholder="20"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1f2024] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#d6ff00] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-valor-total" className="block text-xs font-medium text-white/70">
                    Valor total
                  </label>
                  <input
                    id="input-valor-total"
                    type="text"
                    required
                    placeholder="16,00"
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1f2024] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#d6ff00] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={salvandoVenda}
                className="mt-2 w-full rounded-2xl bg-[#d6ff00] py-3.5 text-center font-display text-sm font-bold text-[#111214] transition hover:brightness-105 disabled:opacity-50"
              >
                {salvandoVenda ? "Salvando..." : "Salvar entrada"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navegação Inferior (Bottom Bar) */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-xl items-stretch justify-around px-2">
          {MAIN_TABS.map((tab) => {
            const active = !menuOpen && isActive(pathname, tab.href);

            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  onClick={() => {
                    setMenuOpen(false);
                    setNotifOpen(false);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={tabClass(active)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}

          <li className="flex-1">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((open) => !open);
                setNotifOpen(false);
              }}
              aria-expanded={menuOpen}
              aria-controls="menu-principal"
              className={tabClass(maisActive)}
            >
              {moreIcon}
              <span>Mais</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}