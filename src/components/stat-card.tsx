import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "default" | "mint" | "amber" | "rose";
}

const toneStyles: Record<
  NonNullable<StatCardProps["tone"]>,
  { chip: string; accent: string }
> = {
  default: {
    chip: "bg-sky-50 text-sky-700",
    accent: "bg-sky-600",
  },
  mint: {
    chip: "bg-emerald-50 text-emerald-700",
    accent: "bg-emerald-600",
  },
  amber: {
    chip: "bg-amber-50 text-amber-700",
    accent: "bg-amber-500",
  },
  rose: {
    chip: "bg-rose-50 text-rose-700",
    accent: "bg-rose-600",
  },
};

/**
 * Try to extract a leading numeric portion from a formatted value
 * (e.g. "1.2K", "98%", "$1,240"). When found, animate from 0 → number
 * and render the original suffix/prefix unchanged.
 */
function parseNumeric(value: string) {
  const match = value.match(/^([^\d-]*)(-?\d[\d.,]*)(.*)$/);
  if (!match) return null;
  const numeric = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  return { prefix: match[1], numeric, suffix: match[3] };
}

function AnimatedValue({ value }: { value: string }) {
  const parsed = parseNumeric(value);
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (latest) => {
    if (!parsed) return value;
    const rounded =
      Math.abs(parsed.numeric) >= 100
        ? Math.round(latest)
        : Math.round(latest * 10) / 10;
    return `${parsed.prefix}${rounded.toLocaleString("en-US")}${parsed.suffix}`;
  });

  useEffect(() => {
    if (!parsed) return;
    const controls = animate(motionVal, parsed.numeric, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [parsed?.numeric]);

  if (!parsed) {
    return <span>{value}</span>;
  }

  return <motion.span>{display}</motion.span>;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${styles.chip}`}
        >
          <Icon size={18} strokeWidth={2.4} />
        </span>
      </div>

      <div className="font-heading text-3xl font-bold tracking-tight text-slate-900">
        <AnimatedValue value={value} />
      </div>
      <div className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
        {hint}
      </div>

      {/* Bottom accent line */}
      <div
        aria-hidden
        className="pointer-events-none mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div className={`h-full w-2/3 rounded-full ${styles.accent}`} />
      </div>
    </article>
  );
}
