import clsx from "clsx";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// =====================================================================
// Section header — eyebrow + title + optional description and trailing slot
// =====================================================================

interface SectionHeadProps {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  eyebrowTone?: "indigo" | "emerald" | "amber" | "rose" | "sky";
  title: string;
  description?: string;
  trailing?: ReactNode;
  className?: string;
}

const eyebrowToneStyles = {
  indigo: "border-indigo-200/70 bg-indigo-50 text-indigo-600",
  emerald: "border-emerald-200/70 bg-emerald-50 text-emerald-600",
  amber: "border-amber-200/70 bg-amber-50 text-amber-600",
  rose: "border-rose-200/70 bg-rose-50 text-rose-600",
  sky: "border-sky-200/70 bg-sky-50 text-sky-600",
} as const;

export function SectionHead({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  eyebrowTone = "indigo",
  title,
  description,
  trailing,
  className,
}: SectionHeadProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? (
          <div
            className={clsx(
              "mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
              eyebrowToneStyles[eyebrowTone],
            )}
          >
            {EyebrowIcon ? <EyebrowIcon size={12} /> : null}
            <span>{eyebrow}</span>
          </div>
        ) : null}
        <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          {title}
        </h3>
        {description ? (
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

// =====================================================================
// Tile — inner sub-card used inside Panels for tightly-packed metrics
// =====================================================================

interface TileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "slate";
  className?: string;
}

const tileAccent = {
  indigo: { bar: "from-indigo-500 to-sky-500", text: "text-indigo-600" },
  emerald: { bar: "from-emerald-500 to-teal-500", text: "text-emerald-600" },
  amber: { bar: "from-amber-500 to-orange-500", text: "text-amber-600" },
  rose: { bar: "from-rose-500 to-pink-500", text: "text-rose-600" },
  slate: { bar: "from-slate-500 to-slate-700", text: "text-slate-600" },
} as const;

export function Tile({
  label,
  value,
  hint,
  icon: Icon,
  accent = "slate",
  className,
}: TileProps) {
  const tone = tileAccent[accent];
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]",
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "absolute inset-x-3 top-0 h-px bg-gradient-to-r opacity-70",
          tone.bar,
        )}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </span>
        {Icon ? (
          <Icon className={clsx("opacity-80", tone.text)} size={14} />
        ) : null}
      </div>
      <div className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
      {hint ? (
        <div className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</div>
      ) : null}
    </div>
  );
}

// =====================================================================
// Pill — small status/category badge with variants
// =====================================================================

const pillVariants = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  violet: "border-teal-200 bg-teal-50 text-teal-700",
  ink: "border-slate-900 bg-slate-900 text-white",
} as const;

export type PillVariant = keyof typeof pillVariants;

export function Pill({
  children,
  variant = "neutral",
  icon: Icon,
  className,
}: {
  children: ReactNode;
  variant?: PillVariant;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        pillVariants[variant],
        className,
      )}
    >
      {Icon ? <Icon size={12} /> : null}
      {children}
    </span>
  );
}

// =====================================================================
// LoadingShell / ErrorShell / EmptyShell
// =====================================================================

export function LoadingShell({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[14rem] flex-col items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-6 py-10 text-center shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-200">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
        />
      </div>
      <div className="text-sm font-semibold text-slate-700">{label}</div>
    </motion.div>
  );
}

export function ErrorShell({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 to-pink-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
        !
      </span>
      <div>{message}</div>
    </div>
  );
}

export function EmptyShell({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-10 text-center backdrop-blur">
      <div className="text-sm font-bold text-slate-700">{title}</div>
      {description ? (
        <div className="max-w-md text-xs text-slate-500">{description}</div>
      ) : null}
    </div>
  );
}

// =====================================================================
// Recharts theme
// =====================================================================

export const chartTheme = {
  grid: "#e2e8f0",
  axis: "#64748b",
  axisFont: 12,
  palette: {
    indigo: "#6366f1",
    violet: "#14b8a6",
    emerald: "#10b981",
    teal: "#14b8a6",
    amber: "#f59e0b",
    orange: "#fb923c",
    rose: "#f43f5e",
    pink: "#ec4899",
    sky: "#0ea5e9",
    ink: "#0b1020",
  },
  tooltip: {
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 20px 50px -25px rgba(15, 23, 42, 0.45)",
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(8px)",
    padding: "8px 12px",
  } as const,
  darkTooltip: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 50px -20px rgba(0, 0, 0, 0.55)",
    background: "rgba(11,16,32,0.96)",
    color: "#f8fafc",
    padding: "8px 12px",
  } as const,
};

// =====================================================================
// Section divider with shimmer
// =====================================================================

export function ShimmerDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "h-px w-full bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent",
        className,
      )}
    />
  );
}

// =====================================================================
// Card section (raw, no Panel, when nested inside a Panel)
// =====================================================================

export function NestedCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]",
        className,
      )}
    >
      {children}
    </div>
  );
}
