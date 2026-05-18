import clsx from "clsx";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={clsx(
        "group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_18px_40px_-28px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-shadow hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_28px_60px_-30px_rgba(79,70,229,0.28)]",
        className,
      )}
    >
      {/* Top sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent opacity-70"
      />
      {/* Hover glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br from-indigo-200/0 via-sky-200/0 to-emerald-200/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60"
      />
      {children}
    </motion.section>
  );
}
