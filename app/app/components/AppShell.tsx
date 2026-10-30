"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

    useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  const onMainTab = MAIN_TABS.some((tab) => isActive(pathname, tab.href));
  const maisActive = menuOpen || !onMainTab;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            aria-label="Ir para o início"
            className="grid size-10 place-items-center rounded-xl bg-acid font-display text-lg font-bold text-ink"
          >
            N
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              aria-label="Notificações"
              title="Em breve"
              className="relative grid size-10 cursor-not-allowed place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white opacity-40"
            >
              {bellIcon}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
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

      <div className="flex flex-1 flex-col">{children}</div>

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
                  onClick={() => setMenuOpen(false)}
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
              onClick={() => setMenuOpen((open) => !open)}
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