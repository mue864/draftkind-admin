import clsx from "clsx";
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
  { chip: string; ring: string; glow: string; accent: string }
> = {
  default: {
    chip: "bg-gradient-to-br from-indigo-500 to-sky-500 text-white",
    ring: "ring-indigo-100",
    glow: "from-indigo-300/20 via-sky-300/15 to-transparent",
    accent: "text-indigo-600",
  },
  mint: {
    chip: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
    ring: "ring-emerald-100",
    glow: "from-emerald-300/20 via-teal-300/15 to-transparent",
    accent: "text-emerald-600",
  },
  amber: {
    chip: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    ring: "ring-amber-100",
    glow: "from-amber-300/25 via-orange-300/15 to-transparent",
    accent: "text-amber-600",
  },
  rose: {
    chip: "bg-gradient-to-br from-rose-500 to-pink-500 text-white",
    ring: "ring-rose-100",
    glow: "from-rose-300/25 via-pink-300/15 to-transparent",
    accent: "text-rose-600",
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
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_30px_-22px_rgba(15,23,42,0.2)] backdrop-blur-xl transition-shadow hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_24px_50px_-26px_rgba(79,70,229,0.32)]"
    >
      {/* Decorative glow */}
      <div
        aria-hidden
        className={clsx(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
          styles.glow,
        )}
      />
      {/* Top sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </span>
        <motion.span
          whileHover={{ rotate: -6, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className={clsx(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-md ring-4",
            styles.chip,
            styles.ring,
          )}
        >
          <Icon size={18} strokeWidth={2.4} />
        </motion.span>
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
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "65%" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className={clsx(
            "h-full rounded-full bg-gradient-to-r",
            tone === "default" && "from-indigo-400 to-sky-500",
            tone === "mint" && "from-emerald-400 to-teal-500",
            tone === "amber" && "from-amber-400 to-orange-500",
            tone === "rose" && "from-rose-400 to-pink-500",
          )}
        />
      </div>
    </motion.article>
  );
}
