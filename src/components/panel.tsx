import clsx from "clsx";
import type { ReactNode } from "react";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-lg border border-slate-200 bg-white p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
