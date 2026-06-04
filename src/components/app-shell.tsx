"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  CircleDollarSign,
  CircleGauge,
  ClipboardList,
  Factory,
  FileStack,
  GitBranch,
  ListChecks,
  LogOut,
  Menu,
  PackageCheck,
  Truck,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { getNavigationIconKey, type NavigationIconKey } from "@/lib/navigation-display";
import { themePreferenceToAttribute, type ThemePreference } from "@/lib/theme";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  avatarFileId?: string | null;
  themePreference?: ThemePreference | null;
  navigationItems: Array<{
    href: string;
    label: string;
  }>;
  profileLabels?: string[];
};

const navigationIcons: Record<NavigationIconKey, LucideIcon> = {
  dashboard: CircleGauge,
  companies: Building2,
  customers: Users,
  suppliers: Factory,
  users: UserCircle,
  statuses: ListChecks,
  shipping: Truck,
  "order-types": FileStack,
  workflows: GitBranch,
  orders: ClipboardList,
  financial: CircleDollarSign,
  default: PackageCheck,
};

export function AppShell({
  children,
  userName,
  avatarFileId,
  themePreference,
  navigationItems,
  profileLabels,
}: AppShellProps) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);
  const themeAttribute = themePreferenceToAttribute(themePreference);
  const isMenuExpanded = isCompactViewport ? isNavOpen : !isSidebarCollapsed;
  const initials = (userName ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");

  useEffect(() => {
    setIsNavOpen(false);
    setIsSessionMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 980px)");
    const updateViewportMode = () => setIsCompactViewport(media.matches);

    updateViewportMode();
    media.addEventListener("change", updateViewportMode);

    return () => media.removeEventListener("change", updateViewportMode);
  }, []);

  function handleMenuToggle() {
    if (isCompactViewport) {
      setIsNavOpen((current) => !current);
      return;
    }

    setIsSidebarCollapsed((current) => !current);
  }

  return (
    <div
      className={`app-shell${isNavOpen ? " nav-open" : ""}${
        isSidebarCollapsed ? " sidebar-collapsed" : ""
      }`}
      data-theme={themeAttribute}
    >
      <header className="app-topbar">
        <div className="topbar-brand">
          <Link className="client-logo-link" href="/">
            <img className="client-logo" src="/magnum-logo.png" alt="Magnum Tires" />
          </Link>
          <button
            type="button"
            className="app-menu-toggle"
            onClick={handleMenuToggle}
            aria-expanded={isMenuExpanded}
            aria-controls="app-navigation"
            aria-label={isMenuExpanded ? "Recolher menu" : "Expandir menu"}
          >
            {isCompactViewport && isNavOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        <div className="topbar-session">
          <div className={`topbar-session-menu${isSessionMenuOpen ? " open" : ""}`}>
            <button
              type="button"
              className="topbar-user-trigger"
              onClick={() => setIsSessionMenuOpen((current) => !current)}
              aria-expanded={isSessionMenuOpen}
              aria-haspopup="menu"
            >
              {avatarFileId ? (
                <img className="session-avatar" src={`/api/files/${avatarFileId}`} alt={userName ?? "Usuário"} />
              ) : (
                <div className="session-avatar session-avatar-fallback">{initials || "U"}</div>
              )}
              <div className="topbar-user-copy">
                <strong>{userName ?? "Usuário"}</strong>
                <span>{profileLabels?.join(", ") ?? "Sem perfil"}</span>
              </div>
              <ChevronDown size={16} />
            </button>

            <div className="topbar-user-dropdown" role="menu">
              <div className="topbar-dropdown-user">
                <strong>{userName ?? "Usuário"}</strong>
                <span>{profileLabels?.join(", ") ?? "Sem perfil"}</span>
              </div>
              <Link className="topbar-dropdown-item" href="/account" role="menuitem">
                <UserCircle size={17} />
                Minha conta
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="topbar-dropdown-item" type="submit" role="menuitem">
                  <LogOut size={17} />
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar-panel">
          <nav id="app-navigation" className="nav">
            {navigationItems.map((item) => {
              const Icon = navigationIcons[getNavigationIconKey(item.href, item.label)];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname === item.href ? "nav-link active" : "nav-link"}
                  title={item.label}
                >
                  <span className="nav-link-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="nav-link-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
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
