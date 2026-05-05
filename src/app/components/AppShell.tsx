import {
  Building2,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Receipt,
  User as UserIcon,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { getRoleLabel } from "../core";
import type {
  AppRoute,
  OverviewCard,
  PageMeta,
  RouteDefinition,
  User,
} from "../types";
import type { ThemeMode } from "../useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { SummaryCard } from "./ui";

const routeIcons: Record<AppRoute, LucideIcon> = {
  dashboard: LayoutDashboard,
  occupancy: Building2,
  billing: Receipt,
  maintenance: Wrench,
  announcements: Megaphone,
  bills: CreditCard,
};

type AppShellProps = {
  currentUser: User;
  route: AppRoute;
  allowedRoutes: RouteDefinition[];
  pageMeta: PageMeta;
  overviewCards: OverviewCard[];
  flash: ReactNode;
  children: ReactNode;
  themeMode: ThemeMode;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  onSetTheme: (mode: ThemeMode) => void;
};

export function AppShell({
  currentUser,
  route,
  allowedRoutes,
  pageMeta,
  overviewCards,
  flash,
  children,
  themeMode,
  onNavigate,
  onLogout,
  onSetTheme,
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <div className="shell">
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "sidebar flex flex-col gap-5 p-5 bg-card border-r border-border",
          isSidebarOpen && "is-open",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Home className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col leading-tight">
              <strong className="text-base font-bold tracking-tight text-foreground">
                Kamu Kamu
              </strong>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Management
              </span>
            </div>
          </div>
          <button
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="ปิดเมนู"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile card */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0 leading-snug gap-0.5">
            <strong
              className="text-sm font-semibold text-foreground break-words"
              title={currentUser.fullName}
            >
              {currentUser.fullName}
            </strong>
            <span className="text-xs font-semibold text-primary">
              {getRoleLabel(currentUser.role)}
            </span>
            <small className="text-[11px] text-muted-foreground">
              @{currentUser.username}
            </small>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          <span className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            เมนูหลัก
          </span>
          {allowedRoutes.map((item) => {
            const Icon = routeIcons[item.key] || LayoutDashboard;
            const isActive = route === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onNavigate(item.key);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-transform",
                    isActive ? "scale-110" : "group-hover:scale-105",
                  )}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex flex-col gap-2 pt-3 border-t border-border">
          <ThemeToggle mode={themeMode} onSetMode={onSetTheme} />
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-area">
        {currentUser.role === "admin" && route === "dashboard" ? (
          <button
            className="hamburger-btn lg:hidden mb-3"
            onClick={() => setIsSidebarOpen(true)}
            title="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        ) : (
          <header className="page-header panel">
            <div className="header-mobile-wrapper">
              <button
                className="hamburger-btn"
                onClick={() => setIsSidebarOpen(true)}
                title="Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <div className="eyebrow subtle">
                  {getRoleLabel(currentUser.role)}
                </div>
                <h1>{pageMeta.title}</h1>
                <p>{pageMeta.description}</p>
              </div>
            </div>
          </header>
        )}

        {flash}
        {route === "dashboard" && currentUser.role !== "admin" ? (
          <section className="overview-grid">
            {overviewCards.map((card) => (
              <SummaryCard
                key={card.label}
                label={card.label}
                value={card.value}
                description={card.description}
              />
            ))}
          </section>
        ) : null}
        {children}
      </main>
    </div>
  );
}
