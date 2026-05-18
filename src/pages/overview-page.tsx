import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Flame,
  Gauge,
  Globe2,
  HardDrive,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  Bar,
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
  EmptyShell,
  ErrorShell,
  LoadingShell,
  Pill,
  PillVariant,
  SectionHead,
  Tile,
  chartTheme,
} from "../components/ui";
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

const pressureVariant: Record<string, PillVariant> = {
  CALM: "emerald",
  STEADY: "sky",
  WARM: "amber",
  HOT: "rose",
  CRITICAL: "rose",
};

const severityVariant: Record<string, PillVariant> = {
  INFO: "sky",
  WARNING: "amber",
  CRITICAL: "rose",
};

const statusVariant: Record<string, PillVariant> = {
  SUCCESS: "emerald",
  PENDING: "amber",
  FAILED: "rose",
};

export function OverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getOverview,
    refetchInterval: 30_000,
  });
  const trendsQuery = useQuery({
    queryKey: ["admin", "trends"],
    queryFn: () => getTrends(14),
    refetchInterval: 60_000,
  });
  const liveQuery = useQuery({
    queryKey: ["admin", "live-activity"],
    queryFn: getLiveActivitySnapshot,
    refetchInterval: 15_000,
  });
  const rewritesQuery = useQuery({
    queryKey: ["admin", "rewrites", "stream"],
    queryFn: () => getRecentRewrites(10),
    refetchInterval: 20_000,
  });

  const minuteSeries = useMemo(() => {
    return (liveQuery.data?.minuteSeries ?? []).map((point) => ({
      label: new Date(point.minuteStart).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      success: point.successfulRequests,
      failed: point.failedRequests,
      guests: point.guestRequests,
    }));
  }, [liveQuery.data]);

  const trendChart = useMemo(() => {
    return (trendsQuery.data ?? []).map((point) => ({
      day: formatShortDate(point.day),
      newUsers: point.newUsers,
      rewrites: point.rewrites,
      failed: point.failedRewrites,
    }));
  }, [trendsQuery.data]);

  if (overviewQuery.isLoading || liveQuery.isLoading || trendsQuery.isLoading) {
    return <LoadingShell label="Initialising console…" />;
  }
  if (overviewQuery.error || !overviewQuery.data) {
    return <ErrorShell message={getApiErrorMessage(overviewQuery.error)} />;
  }
  if (liveQuery.error || !liveQuery.data) {
    return <ErrorShell message={getApiErrorMessage(liveQuery.error)} />;
  }

  const overview = overviewQuery.data;
  const live = liveQuery.data;

  return (
    <div className="space-y-6">
      <PressureBanner live={live} />

      {/* Top metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={formatCompactNumber(overview.totalUsers)}
          hint={`+${formatCompactNumber(overview.usersCreatedLast24Hours)} in 24h`}
          icon={Users}
          tone="default"
        />
        <StatCard
          label="Paid subscriptions"
          value={formatCompactNumber(overview.paidActiveSubscriptions)}
          hint={`${formatCompactNumber(overview.activeTrials)} trialing`}
          icon={Sparkles}
          tone="mint"
        />
        <StatCard
          label="Rewrites · 24h"
          value={formatCompactNumber(overview.rewritesLast24Hours)}
          hint={`${formatCompactNumber(overview.failedRewritesLast24Hours)} failed`}
          icon={Activity}
          tone="amber"
        />
        <StatCard
          label="Guest requests · 24h"
          value={formatCompactNumber(overview.guestRequestsLast24Hours)}
          hint={`${formatCompactNumber(overview.activeMinuteBuckets)} min buckets`}
          icon={Globe2}
          tone="rose"
        />
      </div>

      {/* Pressure chart + infra */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <SectionHead
            eyebrow="Live pressure"
            eyebrowIcon={Flame}
            eyebrowTone="rose"
            title="Last 60 minutes"
            description="Successful vs. failed requests, with guest traffic plotted as the line series."
            trailing={
              <Pill
                variant={pressureVariant[live.pressureLevel] ?? "neutral"}
                icon={Gauge}
              >
                {live.pressureLevel} · {live.pressureScore.toFixed(0)}
              </Pill>
            }
          />
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={minuteSeries}>
                <defs>
                  <linearGradient id="successGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={chartTheme.palette.indigo}
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="100%"
                      stopColor={chartTheme.palette.indigo}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={chartTheme.grid}
                  vertical={false}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  stroke={chartTheme.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                />
                <YAxis
                  stroke={chartTheme.axis}
                  fontSize={chartTheme.axisFont}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: chartTheme.axis }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="success"
                  name="Success"
                  stroke={chartTheme.palette.indigo}
                  strokeWidth={2.5}
                  fill="url(#successGrad)"
                />
                <Bar
                  dataKey="failed"
                  name="Failed"
                  fill={chartTheme.palette.rose}
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="guests"
                  name="Guests"
                  stroke={chartTheme.palette.amber}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <SectionHead
            eyebrow="Infrastructure"
            eyebrowIcon={HardDrive}
            eyebrowTone="indigo"
            title="System pulse"
            description="Heap, CPU, DB pool and HTTP latency at a glance."
          />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Tile
              accent="indigo"
              icon={Cpu}
              label="Process CPU"
              value={formatPercent(live.infrastructure.processCpuUsagePercent)}
              hint={`System ${formatPercent(live.infrastructure.systemCpuUsagePercent)}`}
            />
            <Tile
              accent="emerald"
              icon={Database}
              label="DB pool"
              value={formatPercent(live.infrastructure.dbPoolUsagePercent)}
              hint={`Active ${live.infrastructure.dbPoolActiveConnections ?? 0}/${live.infrastructure.dbPoolMaxConnections ?? "—"}`}
            />
            <Tile
              accent="amber"
              icon={Zap}
              label="Heap"
              value={formatPercent(live.infrastructure.heapUsagePercent)}
              hint={`${live.infrastructure.heapUsedMegabytes.toFixed(0)} / ${live.infrastructure.heapMaxMegabytes.toFixed(0)} MB`}
            />
            <Tile
              accent="rose"
              icon={Wifi}
              label="HTTP p95"
              value={`${live.infrastructure.httpP95LatencyMillis.toFixed(0)}ms`}
              hint={`Mean ${live.infrastructure.httpMeanLatencyMillis.toFixed(0)}ms`}
            />
          </div>

          {live.trendDeltas.length > 0 ? (
            <div className="mt-5 space-y-2">
              {live.trendDeltas.slice(0, 4).map((delta) => (
                <DeltaRow key={delta.key} delta={delta} />
              ))}
            </div>
          ) : null}
        </Panel>
      </div>

      {/* Incidents + recent failures */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel>
          <SectionHead
            eyebrow="Incidents"
            eyebrowIcon={AlertTriangle}
            eyebrowTone="rose"
            title="Active alerts"
            description="Auto-generated incident signals based on pressure heuristics."
          />
          <div className="mt-5 space-y-3">
            {live.incidentAlerts.length === 0 ? (
              <EmptyShell
                title="All clear"
                description="No active incidents in the trailing window."
              />
            ) : (
              live.incidentAlerts.map((alert) => (
                <motion.div
                  key={alert.key}
                  whileHover={{ x: 4 }}
                  className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/80 to-rose-50/30 p-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]"
                >
                  <div className="flex items-center gap-2">
                    <Pill
                      variant={severityVariant[alert.severity] ?? "neutral"}
                    >
                      {alert.severity}
                    </Pill>
                    <span className="font-heading text-sm font-bold text-slate-900">
                      {alert.title}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {alert.summary}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-indigo-600">
                    → {alert.suggestedAction}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHead
            eyebrow="Signals"
            eyebrowIcon={AlertTriangle}
            eyebrowTone="amber"
            title="Recent failure signatures"
            description="Top recurring error messages across the trailing window."
          />
          <div className="mt-5 space-y-2">
            {live.recentFailureSignals.length === 0 ? (
              <EmptyShell
                title="No failures"
                description="Nothing has errored recently."
              />
            ) : (
              live.recentFailureSignals.slice(0, 6).map((signal, index) => (
                <div
                  key={`${signal.message}-${index}`}
                  className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {signal.message}
                    </div>
                    <Pill variant="rose">×{signal.occurrences}</Pill>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock size={10} />
                    {formatDateTime(signal.latestAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* Trend chart */}
      <Panel>
        <SectionHead
          eyebrow="14-day trend"
          eyebrowIcon={TrendingUp}
          eyebrowTone="emerald"
          title="Growth & throughput"
          description="Daily new users, total rewrites and failed rewrites over the trailing fortnight."
        />
        <div className="mt-6 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendChart}>
              <CartesianGrid
                stroke={chartTheme.grid}
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="day"
                stroke={chartTheme.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={chartTheme.axis}
                fontSize={chartTheme.axisFont}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: chartTheme.axis }}
                iconType="circle"
              />
              <Bar
                dataKey="rewrites"
                name="Rewrites"
                fill={chartTheme.palette.sky}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="failed"
                name="Failed"
                fill={chartTheme.palette.rose}
                radius={[8, 8, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="newUsers"
                name="New users"
                stroke={chartTheme.palette.emerald}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Live request stream */}
      <Panel className="p-0">
        <div className="border-b border-slate-200/70 p-6">
          <SectionHead
            eyebrow="Stream"
            eyebrowIcon={Activity}
            title="Latest requests"
            description="Live feed of the newest authenticated rewrite events."
          />
        </div>
        {rewritesQuery.isLoading ? (
          <div className="p-6">
            <LoadingShell label="Loading stream…" />
          </div>
        ) : rewritesQuery.error || !rewritesQuery.data ? (
          <div className="p-6">
            <ErrorShell message={getApiErrorMessage(rewritesQuery.error)} />
          </div>
        ) : rewritesQuery.data.length === 0 ? (
          <div className="p-6">
            <EmptyShell title="Nothing yet" />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rewritesQuery.data.map((item) => (
              <li
                key={item.requestId}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-indigo-50/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-[11px] font-bold text-white">
                  {item.userEmail.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {item.userEmail}
                  </div>
                  <div className="mt-0.5 text-[11px] capitalize text-slate-500">
                    {item.requestType.replaceAll("_", " ").toLowerCase()} ·{" "}
                    {item.tone ?? item.rewriteMode ?? "general"}
                  </div>
                </div>
                <Pill variant={statusVariant[item.status] ?? "neutral"}>
                  {item.status}
                </Pill>
                <span className="hidden text-[11px] text-slate-500 sm:inline">
                  {formatDateTime(item.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function PressureBanner({
  live,
}: {
  live: Awaited<ReturnType<typeof getLiveActivitySnapshot>>;
}) {
  const variant = pressureVariant[live.pressureLevel] ?? "neutral";
  const isHot =
    live.pressureLevel === "HOT" || live.pressureLevel === "CRITICAL";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.4)] ${
        isHot
          ? "border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-pink-50"
          : "border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
              isHot
                ? "bg-gradient-to-br from-rose-500 to-pink-500"
                : "bg-gradient-to-br from-emerald-500 to-teal-500"
            }`}
          >
            {isHot ? <Flame size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill variant={variant} icon={Gauge}>
                Pressure {live.pressureLevel}
              </Pill>
              <Pill variant="ink">Score {live.pressureScore.toFixed(0)}</Pill>
              <span className="text-[11px] font-semibold text-slate-500">
                Captured {formatDateTime(live.capturedAt)}
              </span>
            </div>
            <h2 className="mt-2 font-heading text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl">
              {live.pressureSummary}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 lg:w-[28rem]">
          <MiniMetric
            label="5m total"
            value={formatCompactNumber(live.totalRequestsLast5Minutes)}
            icon={Activity}
          />
          <MiniMetric
            label="Fail rate 15m"
            value={`${(live.failureRateLast15Minutes * 100).toFixed(1)}%`}
            icon={AlertTriangle}
          />
          <MiniMetric
            label="Concurrency"
            value={formatPercent(live.concurrencyPressurePercent)}
            icon={Cpu}
          />
        </div>
      </div>
    </motion.div>
  );
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        <Icon size={11} />
        {label}
      </div>
      <div className="mt-0.5 font-heading text-base font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function DeltaRow({
  delta,
}: {
  delta: {
    label: string;
    currentValue: number;
    previousValue: number;
    changePercent: number;
  };
}) {
  const up = delta.changePercent >= 0;
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2">
      <div className="text-xs font-semibold text-slate-700">{delta.label}</div>
      <div className="flex items-center gap-2">
        <span className="font-heading text-sm font-bold text-slate-900">
          {formatCompactNumber(delta.currentValue)}
        </span>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {Math.abs(delta.changePercent).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// keep CheckCircle2 import used to avoid unused-warning if compile changes later
void CheckCircle2;
