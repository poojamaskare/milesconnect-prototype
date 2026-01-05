"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useLogistics } from "../../lib/context/LogisticsProvider";
import { useMLHealth } from "../../lib/hooks/useAnalytics";
import { ThemeToggle } from "../../components/ThemeToggle";
import { QuickCreateShipmentModal } from "../../components/QuickCreateShipmentModal";
import { QuickCreateDriverModal } from "../../components/QuickCreateDriverModal";
import { NotificationsPanel } from "../../components/NotificationsPanel";
import { useNotifications } from "../../lib/context/NotificationProvider";

type NavItem = {
  label: string;
  href: string;
  enabled: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const base =
    "group flex items-center justify-between gap-3 rounded-md px-3 py-1.5 text-[13px] outline-none transition";

  if (!item.enabled) {
    return (
      <span
        className={`${base} text-muted-foreground/50 hover:text-muted-foreground/60`}
        aria-disabled="true"
      >
        <span className="truncate">{item.label}</span>
        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/50">
          Soon
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${base} ${active
        ? "bg-primary/10 text-foreground ring-1 ring-inset ring-primary/15 font-medium"
        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
        } focus-visible:ring-2 focus-visible:ring-ring/30`}
    >
      <span className="truncate">{item.label}</span>
      {active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      ) : null}
    </Link>
  );
}

function SystemHealthIndicator() {
  const { telemetry } = useLogistics();
  const { data: mlHealth } = useMLHealth();

  const maintenanceCount = telemetry?.maintenanceVehiclesCount || 0;
  // If mlHealth is undefined (loading), treat as ok or unknown
  const mlServiceOk = mlHealth?.available ?? true;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  let message = 'System Operational';

  if (!mlServiceOk) {
    status = 'warning';
    message = 'ML Service Offline';
  } else if (maintenanceCount > 0) {
    status = 'warning';
    message = `${maintenanceCount} Vehicle(s) in Maintenance`;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors
      ${status === 'healthy'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
        : status === 'warning'
          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
      }`}>
      <span className={`relative flex h-2 w-2`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
          ${status === 'healthy' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2
          ${status === 'healthy' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
      </span>
      <span className="hidden sm:inline-block whitespace-nowrap">{message}</span>
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const sections: NavSection[] = useMemo(
    () => [
      {
        title: "Operations",
        items: [
          { label: "Dashboard", href: "/dashboard", enabled: true },
          { label: "Analytics", href: "/dashboard/analytics", enabled: true },
          { label: "Fleet Map", href: "/dashboard/fleet", enabled: true },
        ],
      },
      {
        title: "Execution",
        items: [
          { label: "Shipments", href: "/dashboard/shipments", enabled: true },
          { label: "Drivers", href: "/dashboard/drivers", enabled: true },
        ],
      },
      {
        title: "Assets",
        items: [
          { label: "Vehicles", href: "/dashboard/vehicles", enabled: true },
          {
            label: "Maintenance",
            href: "/dashboard/maintenance",
            enabled: true,
          },
          {
            label: "Optimization",
            href: "/dashboard/optimization",
            enabled: true,
          },
        ],
      },
      {
        title: "Finance",
        items: [
          { label: "Billing", href: "/dashboard/billing", enabled: true },
        ],
      },
      {
        title: "Compliance",
        items: [
          { label: "Documents", href: "/dashboard/documents", enabled: true },
        ],
      },
      {
        title: "System",
        items: [
          { label: "Settings", href: "/dashboard/settings", enabled: false },
        ],
      },
    ],
    []
  );

  return (
    <div className="flex h-full flex-col bg-muted/40 border-r border-border">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4 bg-card">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-foreground tracking-tight">MilesConnect</div>
          <div className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Workspace</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sidebar">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3 bg-card">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            JD
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [createShipmentOpen, setCreateShipmentOpen] = useState(false);
  const [createDriverOpen, setCreateDriverOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-dvh bg-background text-foreground font-inter">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-primary"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card md:block shadow-sm">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar (off-canvas) */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-card shadow-xl transition-transform duration-300">
            <div className="flex h-14 items-center justify-end border-b border-border px-3">
              <button
                type="button"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {/* Top nav */}
      <header className="fixed left-0 right-0 top-0 z-30 h-14 border-b border-border bg-card/80 backdrop-blur-md md:left-64">
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* System Health Indicator - Visible on all screens */}
            <SystemHealthIndicator />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-95"
                onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                aria-expanded={addDropdownOpen}
                aria-haspopup="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span className="hidden sm:inline">New Action</span>
              </button>

              {addDropdownOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close dropdown"
                    onClick={() => setAddDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 transform rounded-xl border border-border bg-card p-2 shadow-2xl ring-1 ring-black/5 transition-all">
                    <div className="space-y-1">
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => {
                          setAddDropdownOpen(false);
                          setCreateShipmentOpen(true);
                        }}
                      >
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Shipment</p>
                          <p className="text-xs text-muted-foreground">Create new delivery</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => {
                          setAddDropdownOpen(false);
                          setCreateDriverOpen(true);
                        }}
                      >
                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Driver</p>
                          <p className="text-xs text-muted-foreground">Onboard new personnel</p>
                        </div>
                      </button>
                      <Link
                        href="/dashboard/vehicles/add"
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setAddDropdownOpen(false)}
                      >
                        <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V13.5m-13.5 4.5v2.25m0-2.25h6m-6 0H3.75m15 0v2.25m0-2.25h3.375m-3.375 0h-3.375m0 0v2.25M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Vehicle</p>
                          <p className="text-xs text-muted-foreground">Add to fleet</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-muted/80 relative"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <span className="sr-only">Notifications</span>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive border border-background"></span>
                )}
              </div>
            </button>
            <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main" className="pt-14 md:pl-64">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Global Modals */}
      <QuickCreateShipmentModal
        isOpen={createShipmentOpen}
        onClose={() => setCreateShipmentOpen(false)}
      />
      <QuickCreateDriverModal
        isOpen={createDriverOpen}
        onClose={() => setCreateDriverOpen(false)}
      />
    </div>
  );
}
