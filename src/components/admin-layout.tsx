import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BadgeDollarSign,
  ChartNoAxesCombined,
  Crown,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAdminSession } from "../hooks/use-admin-session";
import { initials } from "../lib/format";

const navigation = [
  { to: "/", label: "Overview", icon: ChartNoAxesCombined },
  { to: "/users", label: "Users", icon: UsersRound },
  { to: "/rewrites", label: "Rewrite Activity", icon: Activity },
  { to: "/plans", label: "Plans", icon: Crown },
  { to: "/billing", label: "Billing Ops", icon: BadgeDollarSign },
  { to: "/guest-usage", label: "Guest Shield", icon: ShieldCheck },
];

function resolveTitle(pathname: string) {
  const matched = navigation.find((item) =>
    item.to === "/"
      ? pathname === "/"
      : pathname === item.to || pathname.startsWith(`${item.to}/`),
  );

  return matched?.label ?? "Overview";
}

export function AdminLayout() {
  const location = useLocation();
  const { session, signOut } = useAdminSession();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm z-10">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md font-heading">DK</div>
            <div>
              <div className="font-heading font-bold text-slate-800 tracking-tight">Draftkind</div>
              <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">Operations Console</div>
            </div>
          </div>

          <nav className="px-4 pb-6 space-y-1">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 font-medium ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
                to={to}
              >
                <Icon size={18} className="shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3 mb-4 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-sm font-semibold text-slate-700 shrink-0">
              {initials(session?.user.firstName, session?.user.lastName) || "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{session?.user.fullName || "Admin"}</div>
              <div className="text-xs text-slate-500 truncate">{session?.user.email || "admin@draftkind.com"}</div>
            </div>
          </div>

          <button
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            onClick={signOut}
            type="button"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">
              <Sparkles size={14} />
              <span>Premium admin workspace</span>
            </div>
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">{resolveTitle(location.pathname)}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 rounded-md text-sm text-slate-500 border border-slate-200/60 shadow-inner">
              <Search size={16} />
              <span className="hidden sm:inline-block">Monitoring across Draftkind</span>
            </div>
            <div className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full flex items-center shadow-sm">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
               Production
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
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
