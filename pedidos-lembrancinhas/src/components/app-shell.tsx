"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  avatarFileId?: string | null;
  navigationItems: Array<{
    href: string;
    label: string;
  }>;
  profileLabels?: string[];
};

export function AppShell({ children, userName, avatarFileId, navigationItems, profileLabels }: AppShellProps) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const initials = (userName ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  return (
    <div className={`app-shell${isNavOpen ? " nav-open" : ""}`}>
      <div className="mobile-topbar">
        <div>
          <p className="eyebrow">Plataforma operacional</p>
          <strong>Pedidos de Lembrancinhas</strong>
        </div>
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setIsNavOpen((current) => !current)}
          aria-expanded={isNavOpen}
          aria-controls="app-navigation"
          aria-label={isNavOpen ? "Fechar navegação" : "Abrir navegação"}
        >
          {isNavOpen ? <X size={18} /> : <Menu size={18} />}
          Menu
        </button>
      </div>

      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="sidebar-brand">
            <p className="eyebrow">Plataforma operacional</p>
            <h1>Pedidos de lembrancinhas</h1>
            <p className="muted">Fluxo multiempresa com pedidos configuráveis.</p>
          </div>

          <nav id="app-navigation" className="nav">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "nav-link active" : "nav-link"}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="session-card">
              <div className="session-user">
                {avatarFileId ? (
                  <img className="session-avatar" src={`/api/files/${avatarFileId}`} alt={userName ?? "Usuário"} />
                ) : (
                  <div className="session-avatar session-avatar-fallback">{initials || "U"}</div>
                )}
                <div>
                  <p className="eyebrow">Sessão</p>
                  <strong>{userName ?? "Usuário"}</strong>
                  <p className="muted">{profileLabels?.join(", ") ?? "Sem perfil"}</p>
                </div>
              </div>
              <Link className="ghost-button" href="/account">
                Minha conta
              </Link>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="ghost-button" type="submit">
                <LogOut size={16} />
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="content">{children}</main>

      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Fechar navegação"
        onClick={() => setIsNavOpen(false)}
      />
    </div>
  );
}
