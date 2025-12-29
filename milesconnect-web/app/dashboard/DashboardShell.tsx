"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

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
    "group flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm outline-none transition";

  if (!item.enabled) {
    return (
      <span
        className={`${base} text-foreground/50 hover:text-foreground/60`}
        aria-disabled="true"
      >
        <span className="truncate">{item.label}</span>
        <span className="rounded border border-foreground/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-foreground/50">
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
      className={`${base} ${
        active
          ? "bg-sky-500/10 text-foreground ring-1 ring-inset ring-sky-500/15"
          : "text-foreground/80 hover:bg-sky-500/5 hover:text-foreground"
      } focus-visible:ring-2 focus-visible:ring-foreground/30`}
    >
      <span className="truncate">{item.label}</span>
      {active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
      ) : null}
    </Link>
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
          { label: "Fleet Map", href: "/dashboard/fleet", enabled: true },
        ],
      },
      {
        title: "Execution",
        items: [
          { label: "Shipments", href: "/dashboard/shipments", enabled: true },
          {
            label: "Trip Sheets",
            href: "/dashboard/trip-sheets",
            enabled: true,
          },
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
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-foreground/10 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-sky-500/20 bg-sky-500/10 text-sm font-semibold text-sky-300">
          MC
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">MilesConnect</div>
          <div className="truncate text-xs text-foreground/60">Operations Console</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Sidebar">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
              {section.title}
            </div>
            <div className="space-y-1">
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

      <div className="border-t border-foreground/10 px-4 py-3 text-xs text-foreground/60">
        <div className="flex items-center justify-between">
          <span>v0.1</span>
          <span className="truncate">© MilesConnect</span>
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

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-foreground/30"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-foreground/10 bg-card md:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar (off-canvas) */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-foreground/10 bg-card shadow-sm">
            <div className="flex h-14 items-center justify-end border-b border-foreground/10 px-3">
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/30"
                onClick={() => setSidebarOpen(false)}
              >
                Close
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
      <header className="fixed left-0 right-0 top-0 z-40 h-14 border-b border-foreground/10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 md:left-64">
        <div className="flex h-full items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/30 md:hidden"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              Menu
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">Dashboard</div>
              <div className="hidden truncate text-xs text-foreground/60 sm:block">
                Fleet operations • Execution • Finance
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-sm text-sky-300 hover:bg-sky-500/20 hover:text-sky-200 focus-visible:ring-2 focus-visible:ring-sky-500/50"
                onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                aria-expanded={addDropdownOpen}
                aria-haspopup="true"
              >
                <span className="flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Add
                </span>
              </button>

              {addDropdownOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10"
                    aria-label="Close dropdown"
                    onClick={() => setAddDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border border-foreground/10 bg-card shadow-lg">
                    <div className="py-1">
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                        onClick={() => {
                          setAddDropdownOpen(false);
                          // TODO: Handle add shipment
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                          />
                        </svg>
                        Add Shipment
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                        onClick={() => {
                          setAddDropdownOpen(false);
                          // TODO: Handle add driver
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                          />
                        </svg>
                        Add Driver
                      </button>
                      <Link
                        href="/vehicles/add"
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                        onClick={() => setAddDropdownOpen(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V13.5m-13.5 4.5v2.25m0-2.25h6m-6 0H3.75m15 0v2.25m0-2.25h3.375m-3.375 0h-3.375m0 0v2.25M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                        Add Vehicle
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              className="rounded-md border border-foreground/10 bg-card px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/30"
            >
              Account
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main" className="pt-14 md:pl-64">
        <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
