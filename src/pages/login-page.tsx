import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, Waves } from "lucide-react";
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_45%,_#f8fafc_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[-10rem] top-[-10rem] h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 xl:px-12">
        <motion.section
          className="flex flex-col justify-between rounded-[2rem] border border-white/70 bg-slate-950 px-7 py-8 text-white shadow-[0_40px_120px_-40px_rgba(15,23,42,0.55)] backdrop-blur xl:px-10 xl:py-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-200">
              <Sparkles size={14} />
              Draftkind Internal
            </div>

            <h1 className="mt-8 max-w-2xl text-4xl font-bold leading-tight tracking-tight font-heading sm:text-5xl">
              Operate your AI writing product from one calm, high-signal surface.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Monitor plan health, review rewrite activity, inspect guest traffic,
              and stay on top of billing operations without digging through raw logs.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur">
              <div className="mb-3 inline-flex rounded-2xl bg-indigo-400/15 p-3 text-indigo-200">
                <Waves size={18} />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Focus
              </div>
              <div className="mt-2 text-sm font-semibold text-white">Ops + analytics</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur">
              <div className="mb-3 inline-flex rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
                <ShieldCheck size={18} />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Security
              </div>
              <div className="mt-2 text-sm font-semibold text-white">Admin-only JWT access</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur">
              <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-3 text-white">
                <Sparkles size={18} />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Surface
              </div>
              <div className="mt-2 text-sm font-semibold text-white">Built for scale monitoring</div>
            </div>
          </div>
        </motion.section>

        <motion.form
          className="flex items-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <div className="w-full rounded-[2rem] border border-white/80 bg-white/92 p-7 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur xl:p-9">
            <div className="mb-8">
              <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
                Admin Access
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 font-heading">
                Sign in to the console
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use an account that already has the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">ADMIN</code> role in the backend.
              </p>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner shadow-slate-100 transition-colors focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
                  <Mail className="text-slate-400" size={18} />
                  <input
                    autoComplete="email"
                    className="w-full border-0 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@draftkind.com"
                    type="email"
                    value={email}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner shadow-slate-100 transition-colors focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
                  <LockKeyhole className="text-slate-400" size={18} />
                  <input
                    autoComplete="current-password"
                    className="w-full border-0 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    type="password"
                    value={password}
                  />
                </div>
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : null}

            <button
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              <span>{submitting ? "Checking access..." : "Open admin workspace"}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
