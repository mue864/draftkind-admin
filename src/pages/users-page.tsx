import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Coins, Search, Shield, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Panel } from "../components/panel";
import { getApiErrorMessage, getUserDetail, getUsers } from "../lib/api";
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  initials,
} from "../lib/format";

export function UsersPage() {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", query],
    queryFn: () => getUsers(query, 24),
  });

  useEffect(() => {
    if (!usersQuery.data?.length) {
      setSelectedUserId(null);
      return;
    }

    setSelectedUserId((current) =>
      current && usersQuery.data.some((item) => item.userId === current)
        ? current
        : usersQuery.data[0].userId,
    );
  }, [usersQuery.data]);

  const detailQuery = useQuery({
    queryKey: ["admin", "users", selectedUserId, "detail"],
    queryFn: () => getUserDetail(selectedUserId!),
    enabled: Boolean(selectedUserId),
  });

  const statusCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const user of usersQuery.data ?? []) {
      const key = user.subscriptionStatus ?? "NONE";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [usersQuery.data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <Panel className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold text-indigo-600 tracking-[0.22em] uppercase mb-2">
                People And Plans
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
                Search users, inspect billing posture, and review usage
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                Pull up a customer by name or email, then inspect their current plan,
                credit posture, rewrite volume, and account state.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusCount.map(([status, count]) => (
                <span
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                  key={status}
                >
                  {status}: {count}
                </span>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-100/80 transition-colors focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
            <Search className="text-slate-400" size={18} />
            <input
              className="w-full border-0 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by email or name"
              value={query}
            />
          </label>

          {usersQuery.isLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-500">
              Loading users...
            </div>
          ) : usersQuery.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-600">
              {getApiErrorMessage(usersQuery.error)}
            </div>
          ) : (
            <div className="grid gap-3">
              {(usersQuery.data ?? []).map((user, index) => {
                const isActive = selectedUserId === user.userId;

                return (
                  <motion.button
                    key={user.userId}
                    className={[
                      "group w-full rounded-2xl border px-5 py-4 text-left transition-all",
                      isActive
                        ? "border-indigo-200 bg-indigo-50/70 shadow-sm shadow-indigo-100"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
                    ].join(" ")}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedUserId(user.userId)}
                    transition={{ duration: 0.26, delay: index * 0.02 }}
                    type="button"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm shadow-slate-300/60">
                          {initials(user.firstName, user.lastName)}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-base font-bold text-slate-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="truncate text-sm font-medium text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {user.currentPlanName ?? "No plan"}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                            user.subscriptionStatus === "ACTIVE"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {user.subscriptionStatus ?? "NONE"}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {usersQuery.data?.length === 0 ? (
                <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-500">
                  No users matched your search.
                </div>
              ) : null}
            </div>
          )}
        </Panel>

        <Panel className="flex min-h-[620px] flex-col">
          {detailQuery.isLoading ? (
            <div className="flex h-full min-h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-500">
              Loading user detail...
            </div>
          ) : detailQuery.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-600">
              {getApiErrorMessage(detailQuery.error)}
            </div>
          ) : detailQuery.data ? (
            <>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-slate-900 text-lg font-bold text-white shadow-lg shadow-slate-300/60">
                      {initials(detailQuery.data.firstName, detailQuery.data.lastName)}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-indigo-600 tracking-[0.22em] uppercase mb-2">
                        Account Detail
                      </div>
                      <h3 className="truncate text-2xl font-bold text-slate-900 font-heading tracking-tight">
                        {detailQuery.data.firstName} {detailQuery.data.lastName}
                      </h3>
                      <p className="truncate text-sm font-medium text-slate-500">
                        {detailQuery.data.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      <Shield size={14} />
                      {detailQuery.data.role}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <TimerReset size={14} />
                      {detailQuery.data.subscriptionStatus ?? "No active subscription"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Total rewrites
                    </div>
                    <div className="mt-3 text-2xl font-bold text-slate-900 font-heading">
                      {formatCompactNumber(detailQuery.data.totalRewriteCount)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Last 30 days
                    </div>
                    <div className="mt-3 text-2xl font-bold text-slate-900 font-heading">
                      {formatCompactNumber(detailQuery.data.rewritesLast30Days)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <Coins size={13} />
                      Credits remaining
                    </div>
                    <div className="mt-3 text-2xl font-bold text-slate-900 font-heading">
                      {detailQuery.data.creditsRemaining ?? 0}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <CalendarDays size={13} />
                      Current plan
                    </div>
                    <div className="mt-3 text-lg font-bold text-slate-900 font-heading">
                      {detailQuery.data.currentPlanName ?? "None"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-500">History saving</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {detailQuery.data.historyEnabled ? "Enabled" : "Off"}
                  </strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-500">Created</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {formatDate(detailQuery.data.createdAt)}
                  </strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-500">Last updated</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {formatDateTime(detailQuery.data.lastUpdatedAt)}
                  </strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-500">Renewal date</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {formatDate(detailQuery.data.subscriptionRenewalDate)}
                  </strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-500">Billing platform</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {detailQuery.data.billingPlatform ?? "Unavailable"}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center text-sm font-medium text-slate-500">
              Select a user to inspect their subscription and usage.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
