import { motion } from "framer-motion";
import type { ReactNode } from "react";
import clsx from "clsx";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      className={clsx(
        "bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden",
        className
      )}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}
