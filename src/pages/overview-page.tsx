import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Crown,
  Gauge,
  ShieldAlert,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel } from "../components/panel";
import { StatCard } from "../components/stat-card";
import {
  getApiErrorMessage,
  getLiveActivitySnapshot,
  getOverview,
  getRecentRewrites,
  getTrends,
} from "../lib/api";
import {
  formatCompactNumber,
  formatDateTime,
  formatPercent,
  formatShortDate,
} from "../lib/format";

const pressureStyles = {
  STABLE: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    panel:
      "border-emerald-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)]",
  },
  ELEVATED: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    panel:
      "border-amber-200 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#fffbeb_100%)]",
  },
  HIGH: {
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    panel:
      "border-orange-200 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.14),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#fff7ed_100%)]",
  },
  CRITICAL: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    panel:
      "border-rose-200 bg-[radial-gradient(circle_at_top_right,_rgba(244,63,94,0.16),_transparent_32%),linear-gradient(180deg,#ffffff_0%,#fff1f2_100%)]",
  },
} as const;

const statusStyles = {
  SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  FAILED: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const incidentSeverityStyles = {
  INFO: "border-sky-200 bg-sky-50 text-sky-700",
  ELEVATED: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 16px 40px -24px rgba(15, 23, 42, 0.45)",
  background: "#ffffff",
};

function formatMinuteLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function resolvePressureStyle(level: string) {
  return (
    pressureStyles[level as keyof typeof pressureStyles] ??
    pressureStyles.STABLE
  );
}

function resolveStatusStyle(status: string) {
  return (
    statusStyles[status as keyof typeof statusStyles] ??
    "border-slate-200 bg-slate-50 text-slate-700"
  );
}

function resolveIncidentSeverityStyle(severity: string) {
  return (
    incidentSeverityStyles[severity as keyof typeof incidentSeverityStyles] ??
    "border-slate-200 bg-slate-50 text-slate-700"
  );
}

function formatSignedPercent(value: number) {
  const normalized = Number.isFinite(value) ? value : 0;
  const fractionDigits = Math.abs(normalized) >= 100 ? 0 : 1;
  return `${normalized > 0 ? "+" : ""}${normalized.toFixed(fractionDigits)}%`;
}

function resolveDeltaStyle(key: string, changePercent: number) {
  if (key === "failure-drift") {
    if (changePercent > 5) {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }
    if (changePercent < -5) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  if (changePercent > 10) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (changePercent < -10) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function OverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getOverview,
    staleTime: 60_000,
  });

  const trendsQuery = useQuery({
    queryKey: ["admin", "trends", 14],
    queryFn: () => getTrends(14),
    staleTime: 60_000,
  });

  const liveActivityQuery = useQuery({
    queryKey: ["admin", "live-activity"],
    queryFn: getLiveActivitySnapshot,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  const recentRewritesQuery = useQuery({
    queryKey: ["admin", "rewrites", "recent", 12],
    queryFn: () => getRecentRewrites(12),
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  if (
    overviewQuery.isLoading ||
    trendsQuery.isLoading ||
    liveActivityQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center rounded-3xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
        Loading your production activity board...
      </div>
    );
  }

  if (
    overviewQuery.error ||
    trendsQuery.error ||
    liveActivityQuery.error ||
    !overviewQuery.data ||
    !trendsQuery.data ||
    !liveActivityQuery.data
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
        {getApiErrorMessage(
          overviewQuery.error ?? trendsQuery.error ?? liveActivityQuery.error,
        )}
      </div>
    );
  }

  const overview = overviewQuery.data;
  const trends = trendsQuery.data;
  const liveActivity = liveActivityQuery.data;
  const recentRewrites = recentRewritesQuery.data ?? [];
  const pressureStyle = resolvePressureStyle(liveActivity.pressureLevel);

  const conversionRate =
    overview.totalUsers > 0
      ? (overview.paidActiveSubscriptions / overview.totalUsers) * 100
      : 0;
  const trialShare =
    overview.currentSubscriptionsTotal > 0
      ? (overview.activeTrials / overview.currentSubscriptionsTotal) * 100
      : 0;
  const failureRate24Hours =
    overview.rewritesLast24Hours > 0
      ? (overview.failedRewritesLast24Hours / overview.rewritesLast24Hours) *
        100
      : 0;

  const liveSeries = liveActivity.minuteSeries.map((item) => ({
    label: formatMinuteLabel(item.minuteStart),
    rewrites: item.rewriteRequests,
    failures: item.failedRequests,
    pending: item.pendingRequests,
    guestRequests: item.guestRequests,
  }));

  const trendSeries = trends.map((item) => ({
    label: formatShortDate(item.day),
    rewrites: item.rewrites,
    guestRequests: item.guestRequests,
    newUsers: item.newUsers,
    failedRewrites: item.failedRewrites,
  }));

  const planSeries = overview.subscriptionsByPlan.map((item) => ({
    name: item.planName,
    paidSubscribers: item.paidSubscriberCount,
    activeTrials: item.trialSubscriberCount,
  }));

  const trendTotals = trends.reduce(
    (accumulator, item) => ({
      rewrites: accumulator.rewrites + item.rewrites,
      guestRequests: accumulator.guestRequests + item.guestRequests,
      newUsers: accumulator.newUsers + item.newUsers,
      failedRewrites: accumulator.failedRewrites + item.failedRewrites,
    }),
    { rewrites: 0, guestRequests: 0, newUsers: 0, failedRewrites: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Live requests / 5m"
          value={formatCompactNumber(liveActivity.totalRequestsLast5Minutes)}
          hint={`${formatCompactNumber(liveActivity.rewriteRequestsLast5Minutes)} authenticated and ${formatCompactNumber(liveActivity.guestRequestsLast5Minutes)} guest requests`}
          icon={Activity}
          tone="mint"
        />
        <StatCard
          label="AI in flight"
          value={formatCompactNumber(liveActivity.pendingRequests)}
          hint={
            liveActivity.geminiConcurrencyLimit
              ? `${formatPercent(liveActivity.concurrencyPressurePercent)} of the ${liveActivity.geminiConcurrencyLimit}-request Gemini guardrail`
              : "Gemini concurrency guardrail is not configured"
          }
          icon={Gauge}
          tone={liveActivity.pendingRequests > 0 ? "amber" : "default"}
        />
        <StatCard
          label="Failure drift / 15m"
          value={formatPercent(liveActivity.failureRateLast15Minutes)}
          hint={`${formatCompactNumber(liveActivity.failedRequestsLast15Minutes)} failed rewrite events in the last 15 minutes`}
          icon={AlertTriangle}
          tone={liveActivity.failedRequestsLast15Minutes > 0 ? "rose" : "mint"}
        />
        <StatCard
          label="Guest edge / minute"
          value={formatCompactNumber(liveActivity.guestMinuteWindowRequests)}
          hint={`${formatPercent(liveActivity.guestPressurePercent)} of the guest limiter capacity in the active minute window`}
          icon={ShieldAlert}
          tone={liveActivity.guestPressurePercent >= 80 ? "amber" : "default"}
        />
        <StatCard
          label="Tokens / 15m"
          value={formatCompactNumber(liveActivity.totalTokensLast15Minutes)}
          hint="Useful for reading provider cost and prompt intensity, not just request counts"
          icon={Zap}
          tone="default"
        />
      </div>

      <Panel className={clsx("relative overflow-hidden", pressureStyle.panel)}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]",
                  pressureStyle.badge,
                )}
              >
                <Activity size={14} />
                {liveActivity.pressureLevel} pressure
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
                <Clock3 size={14} />
                Auto-refresh every 15s
              </span>
            </div>

            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900">
              Live production activity and pressure
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {liveActivity.pressureSummary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[20rem] xl:w-[24rem]">
            <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Pressure score
              </div>
              <div className="mt-2 font-heading text-3xl font-bold text-slate-900">
                {liveActivity.pressureScore}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Stale pending
              </div>
              <div className="mt-2 font-heading text-3xl font-bold text-slate-900">
                {formatCompactNumber(liveActivity.stalePendingRequests)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm col-span-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Last captured
              </div>
              <div className="mt-2 font-heading text-xl font-bold text-slate-900">
                {formatDateTime(liveActivity.capturedAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 h-[24rem] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={liveSeries}>
              <defs>
                <linearGradient
                  id="liveRewritesGradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient
                  id="liveGuestGradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#dbe4f0"
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={16}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area
                type="monotone"
                dataKey="guestRequests"
                name="Guest"
                fill="url(#liveGuestGradient)"
                stroke="#10b981"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="rewrites"
                name="Authenticated"
                fill="url(#liveRewritesGradient)"
                stroke="#1d4ed8"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="pending"
                name="Pending"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="failures"
                name="Failures"
                stroke="#e11d48"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Provider saturation
            </div>
            <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
              {formatPercent(liveActivity.concurrencyPressurePercent)}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {liveActivity.geminiConcurrencyLimit
                ? `${formatCompactNumber(liveActivity.pendingRequests)} requests currently competing for ${liveActivity.geminiConcurrencyLimit} Gemini slots`
                : "Gemini guardrail is not configured in admin telemetry yet"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Guest edge pressure
            </div>
            <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
              {formatCompactNumber(liveActivity.activeGuestMinuteBuckets)}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {formatCompactNumber(liveActivity.guestMinuteWindowRequests)}{" "}
              requests across the current minute bucket set
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              24h reliability
            </div>
            <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
              {formatPercent(failureRate24Hours)}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {formatCompactNumber(overview.failedRewritesLast24Hours)} failed
              rewrites out of{" "}
              {formatCompactNumber(overview.rewritesLast24Hours)} in 24 hours
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="border-slate-200 bg-white">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">
                <Gauge size={14} />
                Infrastructure
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900">
                Runtime health snapshot
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                This is the system layer behind the app traffic, useful for
                separating provider pressure from JVM or DB pressure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                DB pool used
              </div>
              <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                {formatPercent(liveActivity.infrastructure.dbPoolUsagePercent)}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {liveActivity.infrastructure.dbPoolActiveConnections ?? 0}{" "}
                active of{" "}
                {liveActivity.infrastructure.dbPoolMaxConnections ?? 0} max
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                DB waiters
              </div>
              <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                {formatCompactNumber(
                  liveActivity.infrastructure.dbPoolAwaitingConnections ?? 0,
                )}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Queue pressure at{" "}
                {formatPercent(
                  liveActivity.infrastructure.dbQueuePressurePercent,
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                HTTP p95
              </div>
              <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                {Math.round(liveActivity.infrastructure.httpP95LatencyMillis)}{" "}
                ms
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Mean latency{" "}
                {Math.round(liveActivity.infrastructure.httpMeanLatencyMillis)}{" "}
                ms
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Heap
              </div>
              <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                {formatPercent(liveActivity.infrastructure.heapUsagePercent)}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {formatCompactNumber(
                  liveActivity.infrastructure.heapUsedMegabytes,
                )}{" "}
                MB of{" "}
                {formatCompactNumber(
                  liveActivity.infrastructure.heapMaxMegabytes,
                )}{" "}
                MB
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                CPU
              </div>
              <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                {formatPercent(
                  liveActivity.infrastructure.processCpuUsagePercent,
                )}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Host CPU{" "}
                {formatPercent(
                  liveActivity.infrastructure.systemCpuUsagePercent,
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            {formatCompactNumber(liveActivity.infrastructure.httpRequestCount)}{" "}
            requests have contributed to the live latency sample so far.
          </div>
        </Panel>

        <Panel className="border-slate-200 bg-white">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                <TrendingUp size={14} />
                Short-window deltas
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900">
                Last 15 minutes vs previous 15
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {liveActivity.trendDeltas.map((delta) => (
              <div
                key={delta.key}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {delta.label}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {formatCompactNumber(delta.currentValue)} now vs{" "}
                      {formatCompactNumber(delta.previousValue)} in the previous
                      15-minute window
                    </div>
                  </div>
                  <div
                    className={clsx(
                      "rounded-full border px-3 py-1 text-xs font-bold",
                      resolveDeltaStyle(delta.key, delta.changePercent),
                    )}
                  >
                    {formatSignedPercent(delta.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Panel className="flex min-h-[34rem] flex-col overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Request stream
            </div>
            <h3 className="font-heading text-xl font-bold text-slate-900">
              Latest authenticated activity
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Useful for spotting whether pressure is isolated to one user, one
              status, or a broad provider event.
            </p>
          </div>

          {recentRewritesQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center px-6 text-sm font-medium text-slate-500">
              Loading recent request stream...
            </div>
          ) : recentRewritesQuery.error ? (
            <div className="m-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {getApiErrorMessage(recentRewritesQuery.error)}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      User
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      When
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentRewrites.map((item) => (
                    <tr
                      key={item.requestId}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <strong className="block text-sm font-bold text-slate-900">
                          {item.userEmail}
                        </strong>
                        <span className="mt-0.5 block text-xs text-slate-500 capitalize">
                          {item.tone ?? item.rewriteMode ?? "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium capitalize text-slate-700">
                        {item.requestType.replaceAll("_", " ").toLowerCase()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={clsx(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                            resolveStatusStyle(item.status),
                          )}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          {formatCompactNumber(item.totalTokens)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600">
                  <AlertTriangle size={14} />
                  Incident watchlist
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900">
                  Interpreted production alerts
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {liveActivity.incidentAlerts.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                  No incident threshold is currently breached across provider,
                  DB, or runtime signals.
                </div>
              ) : (
                liveActivity.incidentAlerts.map((alert) => (
                  <div
                    key={alert.key}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {alert.title}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-500">
                          {alert.summary}
                        </div>
                        <div className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          {alert.suggestedAction}
                        </div>
                      </div>
                      <div
                        className={clsx(
                          "rounded-full border px-3 py-1 text-xs font-bold",
                          resolveIncidentSeverityStyle(alert.severity),
                        )}
                      >
                        {alert.severity}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600">
                  <AlertTriangle size={14} />
                  Failure clusters
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900">
                  Top errors from the last hour
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {liveActivity.recentFailureSignals.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                  No clustered failure signal is active in the last hour.
                </div>
              ) : (
                liveActivity.recentFailureSignals.map((signal) => (
                  <div
                    key={`${signal.message}-${signal.latestAt}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {signal.message}
                        </div>
                        <div className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          Last seen {formatDateTime(signal.latestAt)}
                        </div>
                      </div>
                      <div className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                        {formatCompactNumber(signal.occurrences)} hits
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">
                  <ShieldAlert size={14} />
                  Edge hot spots
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900">
                  Guest traffic fingerprints
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {liveActivity.hotGuestBuckets.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-500">
                  No active guest bucket hot spots were reported in the current
                  window.
                </div>
              ) : (
                liveActivity.hotGuestBuckets.map((bucket) => (
                  <div
                    key={`${bucket.bucketType}-${bucket.fingerprintPrefix}-${bucket.windowStart}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {bucket.fingerprintPrefix} ·{" "}
                          {bucket.bucketType.toLowerCase()} bucket
                        </div>
                        <div className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          Active since {formatDateTime(bucket.windowStart)}
                        </div>
                      </div>
                      <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        {formatCompactNumber(bucket.requestCount)} reqs
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Panel className="border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.08),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                <TrendingUp size={14} />
                14-day context
              </div>
              <h3 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Demand and reliability trend line
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Use this slower-moving view to separate one bad hour from a real
                trend in adoption or reliability.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[18rem]">
              <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  14-day rewrites
                </div>
                <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(trendTotals.rewrites)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  New users
                </div>
                <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(trendTotals.newUsers)}
                </div>
              </div>
            </div>
          </div>

          <div className="h-[20rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendSeries}>
                <defs>
                  <linearGradient
                    id="trendGuestGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop
                      offset="100%"
                      stopColor="#10b981"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#e2e8f0"
                  vertical={false}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="guestRequests"
                  name="Guest"
                  fill="url(#trendGuestGradient)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="rewrites"
                  name="Authenticated"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="failedRewrites"
                  name="Failures"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="border-slate-200 bg-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                  <Crown size={14} />
                  Commercial mix
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900">
                  Current plan distribution
                </h3>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={planSeries}
                  layout="vertical"
                  margin={{ left: 8, right: 8 }}
                >
                  <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={92}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="paidSubscribers"
                    name="Paid"
                    stackId="subscriptions"
                    fill="#0f172a"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="activeTrials"
                    name="Trials"
                    stackId="subscriptions"
                    fill="#f59e0b"
                    radius={[0, 10, 10, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="border-slate-200 bg-white">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                  <Users size={14} />
                  Account mix
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900">
                  Growth and monetization context
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Total users
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {formatCompactNumber(overview.usersCreatedLast24Hours)} new
                    in the last 24 hours
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(overview.totalUsers)}
                </div>
              </div>
              <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Paid subscribers
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {formatPercent(conversionRate)} of users have converted
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(overview.paidActiveSubscriptions)}
                </div>
              </div>
              <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Active trials
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {formatPercent(trialShare)} of current subscriptions are
                    still preview users
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(overview.activeTrials)}
                </div>
              </div>
              <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Current subscriptions
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Paid and trial seats combined
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(overview.currentSubscriptionsTotal)}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
