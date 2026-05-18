import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
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
  Sparkles,
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
    description: "Live production pulse",
  },
  {
    to: "/users",
    label: "Users",
    icon: UsersRound,
    description: "Accounts & cohorts",
  },
  {
    to: "/rewrites",
    label: "Rewrite Activity",
    icon: Activity,
    description: "Streamed generations",
  },
  {
    to: "/plans",
    label: "Plans",
    icon: Crown,
    description: "Tier mix & trials",
  },
  {
    to: "/billing",
    label: "Billing Ops",
    icon: BadgeDollarSign,
    description: "Revenue health",
  },
  {
    to: "/guest-usage",
    label: "Guest Shield",
    icon: ShieldCheck,
    description: "Anti-abuse signals",
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
    <div className="relative flex h-screen overflow-hidden bg-transparent font-sans text-[var(--color-ink)]">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="orb absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="orb absolute bottom-[-12rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-emerald-300/15 blur-3xl" />
      </div>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 84 : 272 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="relative z-20 flex h-full flex-col border-r border-white/60 bg-[#0b1020] text-slate-200 shadow-[0_20px_60px_-30px_rgba(11,16,32,0.55)]"
      >
        {/* Header / Brand */}
        <div
          className={clsx(
            "flex items-center gap-3 px-4 pt-6 pb-5",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-teal-500 font-heading text-base font-bold text-white shadow-lg shadow-indigo-500/30">
            DK
            <span className="pulse-dot absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#0b1020] bg-emerald-400" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="brand-label"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="min-w-0"
              >
                <div className="truncate font-heading text-base font-bold tracking-tight text-white">
                  Draftkind
                </div>
                <div className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Ops Console
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse handle */}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((value) => !value)}
          className="absolute -right-3 top-8 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white text-slate-700 shadow-md transition hover:scale-105 hover:text-indigo-600"
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="flex"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </motion.span>
        </button>

        {/* Nav */}
        <nav
          className={clsx(
            "flex-1 overflow-y-auto px-3 py-2",
            collapsed && "px-2",
          )}
        >
          <div
            className={clsx(
              "mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500",
              collapsed && "sr-only",
            )}
          >
            Monitoring
          </div>
          <ul className="space-y-1">
            {navigation.map(({ to, label, icon: Icon, description }) => (
              <li key={to} className="relative">
                <NavLink to={to} end={to === "/"}>
                  {({ isActive }) => (
                    <div
                      className={clsx(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-active-pill"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-indigo-500/25 via-sky-500/20 to-transparent ring-1 ring-inset ring-white/10"
                        />
                      )}
                      <span
                        className={clsx(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? "bg-gradient-to-br from-indigo-500/40 to-sky-500/30 text-white shadow-inner shadow-indigo-400/20"
                            : "bg-white/[0.04] text-slate-300 group-hover:bg-white/[0.08]",
                        )}
                      >
                        <Icon size={18} strokeWidth={2.2} />
                      </span>
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.div
                            key={`label-${to}`}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.16 }}
                            className="min-w-0 flex-1"
                          >
                            <div
                              className={clsx(
                                "truncate text-sm font-semibold",
                                isActive ? "text-white" : "text-slate-200",
                              )}
                            >
                              {label}
                            </div>
                            <div className="truncate text-[11px] text-slate-500">
                              {description}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Collapsed tooltip */}
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full ml-3 hidden -translate-x-1 whitespace-nowrap rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-100 opacity-0 shadow-lg transition group-hover:translate-x-0 group-hover:opacity-100 lg:block">
                          {label}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom user card */}
        <div
          className={clsx("border-t border-white/5 p-3", collapsed && "px-2")}
        >
          <div
            className={clsx(
              "mb-2 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2",
              collapsed &&
                "justify-center border-transparent bg-transparent p-0",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-xs font-bold text-white shadow-md">
              {initials(session?.user.firstName, session?.user.lastName) ||
                "AD"}
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  className="min-w-0 flex-1"
                >
                  <div className="truncate text-sm font-semibold text-white">
                    {session?.user.fullName || "Admin"}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {session?.user.email || "admin@draftkind.com"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={signOut}
            className={clsx(
              "group flex w-full items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-rose-200 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-100",
              collapsed && "justify-center px-2",
            )}
          >
            <LogOut size={14} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main pane */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="relative z-10 flex h-[72px] items-center justify-between gap-4 border-b border-white/60 bg-white/70 px-6 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-600">
                <Sparkles size={12} />
                <span>Monitoring</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500">{active.label}</span>
              </div>
              <h1 className="truncate font-heading text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {active.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-200 md:flex">
              <Search size={14} />
              <input
                type="search"
                placeholder="Search dashboards, users, events…"
                className="w-56 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Command size={10} />K
              </span>
            </div>

            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
              aria-label="Notifications"
            >
              <Bell size={15} />
              <span className="pulse-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Production
            </div>
          </div>
        </header>

        {/* Page area */}
        <main className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
