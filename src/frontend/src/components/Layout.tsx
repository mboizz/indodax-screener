import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  RefreshCw,
  X,
} from "lucide-react";
import { useState } from "react";
import { useMarketSummaries } from "../hooks/useMarketData";
import { formatTime } from "../utils/format";

// ─── Last Sync Badge ───────────────────────────────────────────────────────────
export function LastSyncBadge() {
  const { dataUpdatedAt, isFetching } = useMarketSummaries();
  const lastSync = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <RefreshCw
        className={cn(
          "h-3 w-3",
          isFetching ? "animate-spin text-primary" : "text-muted-foreground",
        )}
      />
      <span className="text-muted-foreground">
        {lastSync ? (
          <>
            <span className="text-foreground">SYNC TERAKHIR:</span>{" "}
            <span className="text-primary">{formatTime(lastSync)} WIB</span>
          </>
        ) : isFetching ? (
          <span className="text-primary animate-pulse">MENGAMBIL DATA...</span>
        ) : (
          <span className="text-muted-foreground">MENUNGGU DATA</span>
        )}
      </span>
    </div>
  );
}

// ─── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "/", label: "BERANDA", icon: LayoutDashboard, end: true },
  { to: "/screener", label: "SCREENER", icon: BarChart2, end: false },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-card border-r border-border transition-smooth shrink-0",
        collapsed ? "w-14" : "w-52",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-border h-14",
          collapsed ? "justify-center px-0" : "px-4 gap-3",
        )}
      >
        <div className="flex items-center justify-center w-7 h-7 bg-primary rounded-sm shrink-0">
          <Activity className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-display font-bold text-foreground leading-tight tracking-wider truncate">
              INDODAX
            </p>
            <p className="text-[10px] font-display text-muted-foreground tracking-widest truncate">
              SCREENER
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && item.to !== "/";
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={`nav-${item.label.toLowerCase()}`}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-sm text-xs font-display font-semibold tracking-wider transition-smooth",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                collapsed && "justify-center",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}

// ─── Mobile Drawer ─────────────────────────────────────────────────────────────
function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const location = useLocation();

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-black/60 z-40 md:hidden border-0 p-0 cursor-default"
          onClick={onClose}
          aria-label="Close menu overlay"
          tabIndex={-1}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-56 bg-card border-r border-border z-50 flex flex-col transition-smooth md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 bg-primary rounded-sm">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-display font-bold text-foreground tracking-wider">
                INDODAX
              </p>
              <p className="text-[10px] font-display text-muted-foreground tracking-widest">
                SCREENER
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-3 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && item.to !== "/";
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                data-ocid={`mobile-nav-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-display font-semibold tracking-wider transition-smooth",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-display font-bold tracking-widest text-foreground hidden sm:block">
                INDODAX SCREENER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LastSyncBadge />
          </div>
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-auto bg-background"
          data-ocid="main-content"
        >
          {children}
        </main>

        {/* Footer */}
        <footer className="shrink-0 bg-card border-t border-border px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono tracking-wider">
            Data disediakan oleh{" "}
            <a
              href="https://indodax.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Indodax.com
            </a>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with love using caffeine.ai
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}
