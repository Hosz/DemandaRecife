"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SaleForm, type SaleFormData } from "./SaleForm";
import { createSale } from "../lib/api";
import { useToast } from "./ToastProvider";

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

const logoutIcon = (
  <Icon>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);

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

const notifications = [
  {
    id: 1,
    title: "Leite pode acabar às 16h",
    category: "Estoque",
    description: "Exemplo de alerta",
  },
  {
    id: 2,
    title: "Escala precisa de reforço",
    category: "Equipe",
    description: "Exemplo de alerta",
  },
  {
    id: 3,
    title: "Promoção sugerida para iogurtes",
    category: "Promoções",
    description: "Exemplo de alerta",
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Entrada rápida global
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);

  async function handleQuickSale(data: SaleFormData) {
    try {
      const result = await createSale(data);

      if (result.ok) {
        showToast("success", "Venda registrada com sucesso!");
        setQuickEntryOpen(false);
        return true;
      }

      showToast("error", "Não foi possível registrar a venda.");
      return false;
    } catch {
      showToast("error", "Erro ao registrar a venda.");
      return false;
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");

    setMenuOpen(false);
    setNotificationsOpen(false);
    setQuickEntryOpen(false);

    router.replace("/onboarding");
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNotificationsOpen(false);
        setQuickEntryOpen(false);
      }
    }

    function handleOpenNotifications() {
      setNotificationsOpen(true);
      setMenuOpen(false);
    }

    function handleOpenQuickEntry() {
      setQuickEntryOpen(true);
      setMenuOpen(false);
      setNotificationsOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-notifications", handleOpenNotifications);
    window.addEventListener("open-quick-entry", handleOpenQuickEntry);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-notifications", handleOpenNotifications);
      window.removeEventListener("open-quick-entry", handleOpenQuickEntry);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  const onMainTab = MAIN_TABS.some((tab) => isActive(pathname, tab.href));
  const maisActive = menuOpen || !onMainTab;

  return (
    <>
      {/* Menu lateral: somente desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-white/10 bg-ink lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <Link
            href="/"
            aria-label="Ir para o início"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-acid font-display text-lg font-bold text-ink"
          >
            N
          </Link>

          <div>
            <p className="font-display text-sm font-bold text-white">
              DemandaRecife
            </p>
            <p className="text-[10px] text-muted">Recife</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Menu principal
          </p>

          <nav aria-label="Menu principal">
            <ul className="space-y-1">
              {MENU_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-acid text-ink"
                          : "text-muted hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <p className="mb-3 text-[10px] text-muted">
            Previsão de demanda para pequenos negócios
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-400/10 hover:text-red-300"
          >
            {logoutIcon}
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Cabeçalho: sem sino duplicado */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:ml-64">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            aria-label="Ir para o início"
            className="grid size-10 place-items-center rounded-xl bg-acid font-display text-lg font-bold text-ink lg:hidden"
          >
            N
          </Link>

          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-muted">
              DemandaRecife
            </p>
          </div>

          {/* Painel acionado pelo sino do dashboard */}
          <div className="relative">
            {notificationsOpen && (
              <section
                id="painel-notificacoes"
                aria-label="Painel de notificações"
                className="absolute right-0 top-12 z-[60] w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#191919] p-4 shadow-2xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">
                    Notificações
                  </h2>

                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs text-muted transition hover:text-white"
                  >
                    Fechar
                  </button>
                </div>

                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted">
                    Avisos demonstrativos
                  </span>

                  <button
                    type="button"
                    onClick={() => setNotificationsRead(true)}
                    disabled={notificationsRead}
                    className="text-[10px] font-semibold text-acid transition hover:underline disabled:cursor-default disabled:opacity-50"
                  >
                    Marcar todas como lidas
                  </button>
                </div>

                <ul className="divide-y divide-white/10">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="flex gap-3 py-3"
                    >
                      <span
                        className={`mt-1 size-2 shrink-0 rounded-full ${
                          notificationsRead ? "bg-muted/40" : "bg-acid"
                        }`}
                      />

                      <div>
                        <p className="text-xs font-medium text-white">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-[10px] text-muted">
                          {notification.category} · {notification.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Botão Mais: somente celular */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="menu-principal-mobile"
            className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white transition hover:bg-white/10 lg:hidden"
          >
            {menuOpen ? closeIcon : moreIcon}
          </button>
        </div>

        {/* Menu Mais: somente celular */}
        {menuOpen && (
          <div
            id="menu-principal-mobile"
            className="border-t border-white/10 px-4 pb-4 pt-3 lg:hidden"
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

            <div className="mt-3 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-400/10 hover:text-red-300"
              >
                {logoutIcon}
                <span>Sair da conta</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Conteúdo das páginas */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {children}
      </div>

      {/* Navegação inferior: somente celular */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
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
                    setNotificationsOpen(false);
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
                setNotificationsOpen(false);
              }}
              aria-expanded={menuOpen}
              aria-controls="menu-principal-mobile"
              className={tabClass(maisActive)}
            >
              {moreIcon}
              <span>Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Modal global de entrada rápida */}
      {quickEntryOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-[5px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setQuickEntryOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-entry-title"
            className="w-full max-w-[290px] rounded-[15px] border border-[#292929] bg-[#151515] p-[14px] shadow-[0_20px_70px_rgba(0,0,0,0.65)]"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-acid">
                  Entrada rápida
                </p>

                <h2
                  id="quick-entry-title"
                  className="mt-1 text-[13px] font-semibold text-white"
                >
                  Registrar uma venda
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setQuickEntryOpen(false)}
                aria-label="Fechar"
                className="grid size-6 place-items-center rounded-md border border-white/10 bg-[#222222] text-neutral-400 transition hover:text-white"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <SaleForm onSubmit={handleQuickSale} />
          </section>
        </div>
      )}
    </>
  );
}