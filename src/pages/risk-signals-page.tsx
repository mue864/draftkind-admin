import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Fingerprint,
  PauseCircle,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

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
import { getApiErrorMessage, getRiskSignals, updateUserModeration } from "../lib/api";
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  initials,
} from "../lib/format";
import type { AdminSecurityEvent, AdminUserRiskSummary } from "../types/api";

const riskVariant: Record<string, PillVariant> = {
  HIGH: "rose",
  MEDIUM: "amber",
  LOW: "sky",
  NONE: "neutral",
};

const severityVariant: Record<string, PillVariant> = {
  CRITICAL: "rose",
  HIGH: "rose",
  MEDIUM: "amber",
  LOW: "sky",
};

const accountStatusVariant: Record<string, PillVariant> = {
  ACTIVE: "emerald",
  SUSPENDED: "amber",
  BANNED: "rose",
};

type ModerationStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

function eventLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function metadataPreview(value: string | null) {
  if (!value) return null;
  return value.length > 140 ? `${value.slice(0, 140)}...` : value;
}

function RiskUserCard({
  user,
  onModerate,
  isPending,
}: {
  user: AdminUserRiskSummary;
  onModerate: (payload: {
    userId: string;
    accountStatus: ModerationStatus;
    reason: string;
  }) => void;
  isPending: boolean;
}) {
  const [nextStatus, setNextStatus] = useState<ModerationStatus | null>(null);
  const [reason, setReason] = useState("");
  const needsReason = nextStatus !== null && nextStatus !== "ACTIVE";

  function submitModeration() {
    if (!nextStatus) return;
    if (needsReason && !reason.trim()) return;
    onModerate({
      userId: user.userId,
      accountStatus: nextStatus,
      reason: reason.trim(),
    });
    setNextStatus(null);
    setReason("");
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-800">
            {initials(user.firstName, user.lastName)}
          </div>
          <div className="min-w-0">
            <Link
              to={`/users?user=${user.userId}`}
              className="truncate font-heading text-base font-bold text-slate-900 hover:text-sky-700"
            >
              {user.firstName || user.lastName
                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                : user.email}
            </Link>
            <div className="mt-1 truncate text-xs font-medium text-slate-500">
              {user.email}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span>Created {formatDate(user.createdAt)}</span>
              <span>Last signal {formatDateTime(user.latestSignalAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <Pill variant={accountStatusVariant[user.accountStatus] ?? "neutral"}>
            {user.accountStatus}
          </Pill>
          <Pill variant={riskVariant[user.riskLevel] ?? "neutral"}>
            {user.riskLevel}
          </Pill>
          <Pill variant="ink">{user.riskScore}/100</Pill>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="24h requests" value={user.requestsLast24Hours} />
        <Metric label="7d requests" value={user.requestsLast7Days} />
        <Metric label="7d failed" value={user.failedRequestsLast7Days} />
        <Metric label="30d limits" value={user.rateLimitViolationsLast30Days} />
        <Metric label="30d auth fails" value={user.failedLoginsLast30Days + user.emailCodeFailuresLast30Days} />
      </div>

      {user.reasons.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {user.reasons.map((reason) => (
            <span
              key={reason}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
            >
              {reason}
            </span>
          ))}
        </div>
      ) : null}

      {user.moderationReason ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {user.moderationReason}
          {user.moderatedAt ? (
            <span className="ml-2 text-amber-700">
              {formatDateTime(user.moderatedAt)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {user.accountStatus === "ACTIVE" ? (
          <>
            <button
              type="button"
              onClick={() => setNextStatus("SUSPENDED")}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
            >
              <PauseCircle size={14} />
              Suspend
            </button>
            <button
              type="button"
              onClick={() => setNextStatus("BANNED")}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
            >
              <Ban size={14} />
              Ban
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setNextStatus("ACTIVE")}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <CheckCircle2 size={14} />
            Restore
          </button>
        )}
      </div>

      {nextStatus ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Reason
              </span>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  nextStatus === "ACTIVE"
                    ? "Optional restore note"
                    : "Required moderation reason"
                }
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-300"
              />
            </label>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  setNextStatus(null);
                  setReason("");
                }}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || (needsReason && !reason.trim())}
                onClick={submitModeration}
                className="h-10 rounded-md border border-slate-900 bg-slate-900 px-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 font-heading text-lg font-bold text-slate-900">
        {formatCompactNumber(value)}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: AdminSecurityEvent }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pill variant={severityVariant[event.severity] ?? "neutral"}>
              {event.severity}
            </Pill>
            <span className="font-semibold text-slate-900">
              {eventLabel(event.eventType)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
            <span>{event.email ?? "No account email"}</span>
            {event.ipHashPrefix ? <span>IP {event.ipHashPrefix}</span> : null}
            {event.deviceHashPrefix ? (
              <span>Device {event.deviceHashPrefix}</span>
            ) : null}
            {event.requestId ? <span>Request #{event.requestId}</span> : null}
          </div>
          {metadataPreview(event.metadata) ? (
            <code className="mt-2 block max-w-full overflow-hidden text-ellipsis rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
              {metadataPreview(event.metadata)}
            </code>
          ) : null}
        </div>
        <div className="shrink-0 text-xs font-medium text-slate-500">
          {formatDateTime(event.createdAt)}
        </div>
      </div>
    </div>
  );
}

export function RiskSignalsPage() {
  const queryClient = useQueryClient();
  const riskQuery = useQuery({
    queryKey: ["admin", "risk-signals"],
    queryFn: () => getRiskSignals(50, 50),
    refetchInterval: 60_000,
  });
  const moderationMutation = useMutation({
    mutationFn: (payload: {
      userId: string;
      accountStatus: ModerationStatus;
      reason: string;
    }) =>
      updateUserModeration(payload.userId, {
        accountStatus: payload.accountStatus,
        reason: payload.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "risk-signals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user-detail"] });
    },
  });

  if (riskQuery.isLoading) {
    return <LoadingShell label="Loading risk signals..." />;
  }

  if (riskQuery.error || !riskQuery.data) {
    return <ErrorShell message={getApiErrorMessage(riskQuery.error)} />;
  }

  const highRisk = riskQuery.data.users.filter(
    (user) => user.riskLevel === "HIGH",
  ).length;
  const mediumRisk = riskQuery.data.users.filter(
    (user) => user.riskLevel === "MEDIUM",
  ).length;
  const rateLimitEvents = riskQuery.data.recentEvents.filter((event) =>
    event.eventType.startsWith("RATE_LIMIT_"),
  ).length;
  const moderatedUsers = riskQuery.data.users.filter(
    (user) => user.accountStatus !== "ACTIVE",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          accent="rose"
          icon={ShieldAlert}
          label="High risk"
          value={formatCompactNumber(highRisk)}
          hint="Accounts needing review"
        />
        <Tile
          accent="amber"
          icon={AlertTriangle}
          label="Medium risk"
          value={formatCompactNumber(mediumRisk)}
          hint="Watchlist accounts"
        />
        <Tile
          accent="indigo"
          icon={Activity}
          label="Ranked users"
          value={formatCompactNumber(riskQuery.data.users.length)}
          hint={`${formatCompactNumber(moderatedUsers)} moderated`}
        />
        <Tile
          accent="emerald"
          icon={Zap}
          label="Recent limit events"
          value={formatCompactNumber(rateLimitEvents)}
          hint="Among latest evidence"
        />
      </div>

      <Panel>
        <SectionHead
          eyebrow="Risk signals"
          eyebrowIcon={ShieldAlert}
          eyebrowTone="rose"
          title="User abuse watch"
          description="Ranked accounts based on durable auth events, rate-limit violations, request volume, failures, token burn, and guest-device linkage."
          trailing={<Pill variant="neutral">Last 50 ranked</Pill>}
        />

        {moderationMutation.error ? (
          <div className="mt-4">
            <ErrorShell message={getApiErrorMessage(moderationMutation.error)} />
          </div>
        ) : null}

        <div className="mt-5 max-h-[calc(100vh-22rem)] space-y-3 overflow-y-auto pr-2">
          {riskQuery.data.users.length === 0 ? (
            <EmptyShell
              title="No risk signals"
              description="No users currently match the risk scoring thresholds."
            />
          ) : (
            riskQuery.data.users.map((user) => (
              <RiskUserCard
                key={user.userId}
                user={user}
                isPending={
                  moderationMutation.isPending &&
                  moderationMutation.variables?.userId === user.userId
                }
                onModerate={(payload) => moderationMutation.mutate(payload)}
              />
            ))
          )}
        </div>
      </Panel>

      <Panel>
        <SectionHead
          eyebrow="Evidence"
          eyebrowIcon={Fingerprint}
          eyebrowTone="sky"
          title="Recent security events"
          description="Durable auth, rate-limit, and guest-link events captured by the backend."
          trailing={
            <Pill variant="neutral" icon={Clock}>
              Last 50
            </Pill>
          }
        />

        <div className="mt-5 max-h-[calc(100vh-24rem)] space-y-3 overflow-y-auto pr-2">
          {riskQuery.data.recentEvents.length === 0 ? (
            <EmptyShell
              title="No events yet"
              description="Security events will appear as auth, rate-limit, and guest-link signals are captured."
            />
          ) : (
            riskQuery.data.recentEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

export default RiskSignalsPage;
