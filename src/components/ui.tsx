import clsx from "clsx";
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
  indigo: "border-sky-200 bg-sky-50 text-sky-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
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
              "mb-3 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
              eyebrowToneStyles[eyebrowTone],
            )}
          >
            {EyebrowIcon ? <EyebrowIcon size={12} /> : null}
            <span>{eyebrow}</span>
          </div>
        ) : null}
        <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900">
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
  indigo: { bar: "bg-sky-600", text: "text-sky-700" },
  emerald: { bar: "bg-emerald-600", text: "text-emerald-700" },
  amber: { bar: "bg-amber-500", text: "text-amber-700" },
  rose: { bar: "bg-rose-600", text: "text-rose-700" },
  slate: { bar: "bg-slate-500", text: "text-slate-600" },
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
        "relative overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-4",
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "absolute inset-x-0 top-0 h-0.5",
          tone.bar,
        )}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
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
  indigo: "border-sky-200 bg-sky-50 text-sky-700",
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
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold",
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
    <div className="flex min-h-[14rem] flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-700" />
      </div>
      <div className="text-sm font-semibold text-slate-700">{label}</div>
    </div>
  );
}

export function ErrorShell({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-600 text-white">
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
    <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
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
    indigo: "#0369a1",
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
    borderRadius: 8,
    border: "1px solid #d0d5dd",
    background: "#ffffff",
    padding: "8px 12px",
  } as const,
  darkTooltip: {
    borderRadius: 8,
    border: "1px solid #1f2937",
    background: "#111827",
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
        "h-px w-full bg-slate-200",
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
        "relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
