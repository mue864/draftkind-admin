import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 font-sans text-slate-900">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 font-heading text-sm font-bold text-sky-800">
              DK
            </div>
            <div>
              <div className="font-heading text-base font-bold tracking-tight text-slate-950">
                DraftKind
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Admin Console
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Email
              </span>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 transition-colors focus-within:border-sky-400">
                <Mail size={16} className="text-slate-400" />
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@draftkind.com"
                  className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Password
              </span>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 transition-colors focus-within:border-sky-400">
                <LockKeyhole size={16} className="text-slate-400" />
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </label>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              disabled={submitting || !email || !password.trim()}
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{submitting ? "Verifying access..." : "Sign in"}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
