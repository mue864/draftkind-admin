import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AtSign,
  CalendarClock,
  CheckCircle2,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Panel } from "../components/panel";
import {
  EmptyShell,
  ErrorShell,
  LoadingShell,
  Pill,
  PillVariant,
  SectionHead,
  Tile,
} from "../components/ui";
import { getApiErrorMessage, getUserDetail, getUsers } from "../lib/api";
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  initials,
} from "../lib/format";

const subscriptionKindVariant: Record<string, PillVariant> = {
  TRIAL: "amber",
  PAID: "emerald",
  LIFETIME: "violet",
  FREE: "neutral",
};

function subscriptionPill(kind: string) {
  return subscriptionKindVariant[kind.toUpperCase()] ?? "neutral";
}

export function UsersPage() {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", query],
    queryFn: () => getUsers(query),
    refetchInterval: 60_000,
  });

  const userDetailQuery = useQuery({
    queryKey: ["admin", "user-detail", selectedUserId],
    queryFn: () => getUserDetail(selectedUserId as string),
    enabled: Boolean(selectedUserId),
  });

  const list = usersQuery.data ?? [];
  const stats = useMemo(() => {
    const paid = list.filter(
      (u) => u.subscriptionKind?.toUpperCase() === "PAID",
    ).length;
    const trial = list.filter(
      (u) => u.subscriptionKind?.toUpperCase() === "TRIAL",
    ).length;
    return { paid, trial, total: list.length };
  }, [list]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile
          label="In view"
          accent="indigo"
          icon={Users}
          value={formatCompactNumber(stats.total)}
          hint="Result count"
        />
        <Tile
          label="Paid"
          accent="emerald"
          icon={CheckCircle2}
          value={formatCompactNumber(stats.paid)}
          hint="Active paid subs"
        />
        <Tile
          label="Trialing"
          accent="amber"
          icon={Sparkles}
          value={formatCompactNumber(stats.trial)}
          hint="In trial window"
        />
        <Tile
          label="Free"
          accent="slate"
          icon={UserRound}
          value={formatCompactNumber(stats.total - stats.paid - stats.trial)}
          hint="No paid plan"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="p-0">
          <div className="border-b border-slate-200/70 p-6">
            <SectionHead
              eyebrow="Directory"
              eyebrowIcon={Users}
              title="Accounts"
              description="Search and inspect any account in seconds."
              trailing={
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search email or name"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-56 bg-transparent text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              }
            />
          </div>

          {usersQuery.isLoading ? (
            <div className="p-6">
              <LoadingShell label="Loading users…" />
            </div>
          ) : usersQuery.error ? (
            <div className="p-6">
              <ErrorShell message={getApiErrorMessage(usersQuery.error)} />
            </div>
          ) : list.length === 0 ? (
            <div className="p-6">
              <EmptyShell title="No matches" description="Try another query." />
            </div>
          ) : (
            <ul className="max-h-[44rem] divide-y divide-slate-100 overflow-y-auto">
              {list.map((user) => {
                const active = user.userId === selectedUserId;
                return (
                  <li key={user.userId}>
                    <motion.button
                      whileHover={{ x: 4 }}
                      type="button"
                      onClick={() => setSelectedUserId(user.userId)}
                      className={`flex w-full items-center gap-4 px-6 py-4 text-left transition ${
                        active
                          ? "bg-gradient-to-r from-indigo-50/80 via-sky-50/60 to-transparent"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-xs font-bold text-white shadow">
                        {initials(user.firstName, user.lastName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {user.firstName || user.lastName
                            ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                            : user.email}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] font-medium text-slate-500">
                          <AtSign size={10} />
                          {user.email}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Pill variant={subscriptionPill(user.subscriptionKind)}>
                          {user.subscriptionKind || "FREE"}
                        </Pill>
                        {user.currentPlanName ? (
                          <span className="text-[10px] font-semibold text-slate-500">
                            {user.currentPlanName}
                          </span>
                        ) : null}
                      </div>
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <SectionHead
            eyebrow="Account detail"
            eyebrowIcon={UserRound}
            eyebrowTone="emerald"
            title={selectedUserId ? "Account profile" : "Select an account"}
            description={
              selectedUserId
                ? "Live snapshot of plan, credits, billing and lifecycle dates."
                : "Tap any row on the left to see the full account profile."
            }
          />

          <div className="mt-6">
            {!selectedUserId ? (
              <EmptyShell
                title="Nothing selected"
                description="Pick a user to inspect their plan, credits, and history."
              />
            ) : userDetailQuery.isLoading ? (
              <LoadingShell label="Loading user…" />
            ) : userDetailQuery.error || !userDetailQuery.data ? (
              <ErrorShell message={getApiErrorMessage(userDetailQuery.error)} />
            ) : (
              <UserDetailView detail={userDetailQuery.data} />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function UserDetailView({
  detail,
}: {
  detail: ReturnType<typeof Object> extends never
    ? never
    : Awaited<ReturnType<typeof getUserDetail>>;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/40 px-5 py-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 font-heading text-base font-bold text-white shadow-lg">
          {initials(detail.firstName, detail.lastName)}
        </div>
        <div className="min-w-0">
          <div className="font-heading text-lg font-bold tracking-tight text-slate-900">
            {`${detail.firstName ?? ""} ${detail.lastName ?? ""}`.trim() ||
              detail.email}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <AtSign size={11} />
            {detail.email}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill
              variant={detail.role === "ADMIN" ? "ink" : "neutral"}
              icon={ShieldCheck}
            >
              {detail.role}
            </Pill>
            <Pill variant={subscriptionPill(detail.subscriptionKind)}>
              {detail.subscriptionKind || "FREE"}
            </Pill>
            {detail.currentPlanName ? (
              <Pill variant="indigo">{detail.currentPlanName}</Pill>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile
          accent="indigo"
          label="Credits left"
          value={
            detail.creditsRemaining == null
              ? "—"
              : formatCompactNumber(detail.creditsRemaining)
          }
        />
        <Tile
          accent="emerald"
          label="Lifetime rewrites"
          value={formatCompactNumber(detail.totalRewriteCount)}
        />
        <Tile
          accent="amber"
          label="30-day rewrites"
          value={formatCompactNumber(detail.rewritesLast30Days)}
        />
        <Tile
          accent="slate"
          label="History"
          value={detail.historyEnabled ? "Enabled" : "Disabled"}
        />
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
        <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <CalendarClock size={11} />
          Lifecycle
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
          <Row k="Created" v={formatDate(detail.createdAt)} />
          <Row k="Updated" v={formatDateTime(detail.lastUpdatedAt)} />
          <Row k="Subscription" v={detail.subscriptionStatus ?? "—"} />
          <Row
            k="Renewal"
            v={
              detail.subscriptionRenewalDate
                ? formatDate(detail.subscriptionRenewalDate)
                : "—"
            }
          />
          <Row
            k="Preview ends"
            v={
              detail.previewEndsAt ? formatDateTime(detail.previewEndsAt) : "—"
            }
          />
          <Row k="Billing" v={detail.billingPlatform ?? "—"} />
        </dl>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-slate-200/70 py-1.5 last:border-0">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-semibold text-slate-800">{v}</dd>
    </div>
  );
}
