import clsx from "clsx";
import { motion } from "framer-motion";
import {
  Activity,
  BadgeDollarSign,
  Bell,
  ChartNoAxesCombined,
  ChevronLeft,
  Command,
  Crown,
  LogOut,
  PanelLeft,
  Search,
  ShieldCheck,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAdminSession } from "../hooks/use-admin-session";
import { initials } from "../lib/format";

const navigation = [
  {
    to: "/",
    label: "Overview",
    icon: ChartNoAxesCombined,
    description: "Service health",
  },
  {
    to: "/users",
    label: "Users",
    icon: UsersRound,
    description: "Accounts",
  },
  {
    to: "/rewrites",
    label: "Rewrite Activity",
    icon: Activity,
    description: "Requests",
  },
  {
    to: "/plans",
    label: "Plans",
    icon: Crown,
    description: "Catalog",
  },
  {
    to: "/billing",
    label: "Billing Ops",
    icon: BadgeDollarSign,
    description: "Events",
  },
  {
    to: "/guest-usage",
    label: "Guest Shield",
    icon: ShieldCheck,
    description: "Limits",
  },
  {
    to: "/risk-signals",
    label: "Risk Signals",
    icon: ShieldAlert,
    description: "Abuse watch",
  },
];

const SIDEBAR_STORAGE_KEY = "draftkind.admin.sidebar.collapsed";

function resolveActive(pathname: string) {
  return (
    navigation.find((item) =>
      item.to === "/"
        ? pathname === "/"
        : pathname === item.to || pathname.startsWith(`${item.to}/`),
    ) ?? navigation[0]
  );
}

export function AdminLayout() {
  const location = useLocation();
  const { session, signOut } = useAdminSession();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const active = resolveActive(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <motion.aside
        animate={{ width: collapsed ? 72 : 264 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="hidden h-full shrink-0 flex-col border-r border-slate-200 bg-white lg:flex"
      >
        <div
          className={clsx(
            "flex h-16 items-center gap-3 border-b border-slate-200 px-4",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 font-heading text-sm font-bold text-sky-800">
            DK
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate font-heading text-sm font-bold text-slate-950">
                DraftKind
              </div>
              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Admin Console
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={clsx(
            "flex items-center border-b border-slate-100 p-3",
            collapsed && "justify-center",
          )}
        >
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">
                {session?.user.fullName || "Admin"}
              </div>
              <div className="truncate text-xs text-slate-500">
                {session?.user.email || "admin@draftkind.com"}
              </div>
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
              {initials(session?.user.firstName, session?.user.lastName) || "AD"}
            </div>
          )}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4">
          {!collapsed ? (
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Monitoring
            </div>
          ) : null}
          <ul className="space-y-1">
            {navigation.map(({ to, label, icon: Icon, description }) => (
              <li key={to}>
                <NavLink to={to} end={to === "/"}>
                  {({ isActive }) => (
                    <div
                      className={clsx(
                        "flex h-10 items-center gap-3 rounded-lg border border-transparent px-3 text-sm transition-colors",
                        isActive
                          ? "border-sky-200 bg-sky-50 text-sky-800"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                        collapsed && "justify-center px-0",
                      )}
                      title={collapsed ? label : undefined}
                    >
                      <Icon
                        size={17}
                        strokeWidth={2.2}
                        className={isActive ? "text-sky-700" : "text-slate-500"}
                      />
                      {!collapsed ? (
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{label}</div>
                          <div className="truncate text-[11px] text-slate-500">
                            {description}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-200 p-2.5">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={clsx(
              "mb-2 flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={16}
              className={clsx("transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed ? <span>Collapse</span> : null}
          </button>
          <button
            type="button"
            onClick={signOut}
            className={clsx(
              "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut size={16} />
            {!collapsed ? <span>Sign out</span> : null}
          </button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Monitoring / {active.label}
              </div>
              <h1 className="truncate font-heading text-xl font-bold tracking-tight text-slate-950">
                {active.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 transition-colors focus-within:border-sky-300 md:flex">
              <Search size={14} />
              <input
                type="search"
                placeholder="Search console"
                className="w-52 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Command size={10} />K
              </span>
            </div>

            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell size={15} />
              <span className="pulse-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Production
            </div>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
