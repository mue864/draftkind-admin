import { motion } from "framer-motion";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useState } from "react";

import { useAdminSession } from "../hooks/use-admin-session";
import { getApiErrorMessage } from "../lib/api";

export function LoginPage() {
  const { signIn } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1020] px-4 py-10 font-sans text-white">
      {/* Animated mesh background */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <motion.div
          className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-indigo-500/40 blur-[120px]"
          animate={{ x: [0, 60, -40, 0], y: [0, -30, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10rem] right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-teal-500/30 blur-[120px]"
          animate={{ x: [0, -50, 30, 0], y: [0, 40, -30, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[-6rem] bottom-[6rem] h-72 w-72 rounded-full bg-emerald-400/25 blur-[110px]"
          animate={{ x: [0, 40, -20, 0], y: [0, -40, 30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Outer gradient frame */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-500/60 via-sky-500/40 to-teal-500/60 p-px shadow-[0_40px_120px_-30px_rgba(99,102,241,0.55)]">
          <div className="rounded-3xl bg-[#0f172a]/95 p-8 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-teal-500 font-heading text-lg font-bold shadow-lg shadow-indigo-500/30">
                DK
              </div>
              <div>
                <div className="font-heading text-base font-bold tracking-tight text-white">
                  Draftkind
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-300">
                  Ops Console
                </div>
              </div>
            </div>

            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">
                <Sparkles size={12} />
                Admin access
              </div>
              <h1 className="mt-4 font-heading text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                Open the monitoring console
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Sign in with an account that holds the{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-indigo-200">
                  ADMIN
                </code>{" "}
                role.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Email
                </span>
                <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 transition focus-within:border-indigo-400/60 focus-within:bg-white/[0.07] focus-within:ring-2 focus-within:ring-indigo-400/30">
                  <Mail size={16} className="text-indigo-300" />
                  <input
                    autoComplete="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@draftkind.com"
                    className="w-full bg-transparent text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Password
                </span>
                <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 transition focus-within:border-indigo-400/60 focus-within:bg-white/[0.07] focus-within:ring-2 focus-within:ring-indigo-400/30">
                  <LockKeyhole size={16} className="text-indigo-300" />
                  <input
                    autoComplete="current-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    className="w-full bg-transparent text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </label>

              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-200"
                >
                  {error}
                </motion.div>
              ) : null}

              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -1 }}
                disabled={submitting}
                type="submit"
                className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span>
                  {submitting ? "Verifying access…" : "Enter dashboard"}
                </span>
                <ArrowRight size={15} />
              </motion.button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
              <ShieldCheck size={12} className="text-emerald-400" />
              JWT-based admin auth · Production endpoint
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
