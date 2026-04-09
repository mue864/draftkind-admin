import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "default" | "mint" | "amber" | "rose";
}

const toneStyles = {
  default: "text-indigo-600 bg-indigo-50 border-indigo-100",
  mint: "text-emerald-600 bg-emerald-50 border-emerald-100",
  amber: "text-amber-600 bg-amber-50 border-amber-100",
  rose: "text-rose-600 bg-rose-50 border-rose-100",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  return (
    <motion.article
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38 }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={clsx("p-2 rounded-lg border", toneStyles[tone])}>
          <Icon size={18} strokeWidth={2.5} />
        </span>
      </div>
      <div className="text-3xl font-bold text-slate-900 font-heading tracking-tight mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-500">{hint}</div>
    </motion.article>
  );
}
