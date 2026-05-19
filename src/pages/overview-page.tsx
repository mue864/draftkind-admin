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
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
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
  formatAdminProviderLabel,
  formatCompactNumber,
  formatDateTime,
  formatPercent,
  formatShortDate,
  normalizeAdminProvider,
} from "../lib/format";

const LIVE_WINDOW_OPTIONS = [
  { label: "1h", value: 60 },
  { label: "3h", value: 180 },
  { label: "12h", value: 720 },
  { label: "24h", value: 1440 },
] as const;

const TREND_WINDOW_OPTIONS = [7, 14, 30, 90] as const;

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

const providerVariant: Record<string, PillVariant> = {
  openai: "emerald",
  gemini: "indigo",
  unknown: "neutral",
};

type ProviderMetric = {
  provider: string;
  requestCount: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
};

function emptyProviderMetric(provider: string): ProviderMetric {
  return {
    provider,
    requestCount: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
  };
}

export function OverviewPage() {
  const [liveWindowMinutes, setLiveWindowMinutes] =
    useState<(typeof LIVE_WINDOW_OPTIONS)[number]["value"]>(60);
  const [trendDays, setTrendDays] =
    useState<(typeof TREND_WINDOW_OPTIONS)[number]>(14);

  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getOverview,
    refetchInterval: 30_000,
  });
  const trendsQuery = useQuery({
    queryKey: ["admin", "trends", trendDays],
    queryFn: () => getTrends(trendDays),
    refetchInterval: 60_000,
  });
  const liveQuery = useQuery({
    queryKey: ["admin", "live-activity", liveWindowMinutes],
    queryFn: () => getLiveActivitySnapshot(liveWindowMinutes),
    refetchInterval: 15_000,
  });
  const rewritesQuery = useQuery({
    queryKey: ["admin", "rewrites", "stream"],
    queryFn: () => getRecentRewrites(10),
    refetchInterval: 20_000,
  });

  const pressureSeries = useMemo(() => {
    return (liveQuery.data?.minuteSeries ?? []).map((point) => ({
      label: new Date(point.minuteStart).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      success: point.successfulRequests,
      failed: point.failedRequests,
      guests: point.guestRequests,
      pending: point.pendingRequests,
      rewriteRequests: point.rewriteRequests,
      totalTraffic: point.rewriteRequests + point.guestRequests,
      failureRatePercent:
        point.rewriteRequests > 0
          ? (point.failedRequests / point.rewriteRequests) * 100
          : 0,
      guestSharePercent:
        point.rewriteRequests + point.guestRequests > 0
          ? (point.guestRequests /
              (point.rewriteRequests + point.guestRequests)) *
            100
          : 0,
    }));
  }, [liveQuery.data]);

  const pressureHighlights = useMemo(() => {
    function peakBy(key: "success" | "failed" | "guests" | "totalTraffic") {
      return pressureSeries.reduce<(typeof pressureSeries)[number] | null>(
        (current, point) => {
          if (!current || point[key] > current[key]) {
            return point;
          }

          return current;
        },
        null,
      );
    }

    return {
      peakSuccess: peakBy("success"),
      peakFailed: peakBy("failed"),
      peakGuests: peakBy("guests"),
      peakTraffic: peakBy("totalTraffic"),
      latest: pressureSeries[pressureSeries.length - 1] ?? null,
    };
  }, [pressureSeries]);

  const trendChart = useMemo(() => {
    return (trendsQuery.data ?? []).map((point) => ({
      day: formatShortDate(point.day),
      fullDay: point.day,
      newUsers: point.newUsers,
      rewrites: point.rewrites,
      failed: point.failedRewrites,
      failureRatePercent:
        point.rewrites > 0 ? (point.failedRewrites / point.rewrites) * 100 : 0,
    }));
  }, [trendsQuery.data]);

  const providerUsage = useMemo(() => {
    const grouped = new Map<string, ProviderMetric>();

    for (const item of liveQuery.data?.providerUsage ?? []) {
      const provider = normalizeAdminProvider(item.provider);
      const current = grouped.get(provider) ?? emptyProviderMetric(provider);

      current.requestCount += item.requestCount;
      current.successfulRequests += item.successfulRequests;
      current.failedRequests += item.failedRequests;
      current.totalTokens += item.totalTokens;

      grouped.set(provider, current);
    }

    const openai = grouped.get("openai") ?? emptyProviderMetric("openai");
    const gemini = grouped.get("gemini") ?? emptyProviderMetric("gemini");
    const other = Array.from(grouped.values())
      .filter(
        (item) => item.provider !== "openai" && item.provider !== "gemini",
      )
      .reduce(
        (aggregate, item) => ({
          provider: "other",
          requestCount: aggregate.requestCount + item.requestCount,
          successfulRequests:
            aggregate.successfulRequests + item.successfulRequests,
          failedRequests: aggregate.failedRequests + item.failedRequests,
          totalTokens: aggregate.totalTokens + item.totalTokens,
        }),
        emptyProviderMetric("other"),
      );

    const ordered = Array.from(grouped.values()).sort(
      (left, right) =>
        right.totalTokens - left.totalTokens ||
        right.requestCount - left.requestCount ||
        left.provider.localeCompare(right.provider),
    );

    return {
      openai,
      gemini,
      other,
      ordered,
    };
  }, [liveQuery.data]);

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
  const providerTokensInWindow = providerUsage.ordered.reduce(
    (sum, item) => sum + item.totalTokens,
    0,
  );
  const liveWindowLabel = formatLiveWindowLabel(live.seriesWindowMinutes);

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

      <Panel>
        <SectionHead
          eyebrow="Provider burn"
          eyebrowIcon={Sparkles}
          eyebrowTone="amber"
          title="OpenAI vs Gemini token usage"
          description={`Provider usage across the selected live window of ${liveWindowLabel}, grouped by token burn and request volume.`}
          trailing={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <RangeChipGroup
                value={liveWindowMinutes}
                options={LIVE_WINDOW_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                onChange={(value) =>
                  setLiveWindowMinutes(
                    value as (typeof LIVE_WINDOW_OPTIONS)[number]["value"],
                  )
                }
              />
              <Pill variant="ink">
                Captured {formatDateTime(live.capturedAt)}
              </Pill>
            </div>
          }
        />

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tile
            label="OpenAI"
            accent="emerald"
            icon={Sparkles}
            value={formatCompactNumber(providerUsage.openai.totalTokens)}
            hint={`${formatCompactNumber(providerUsage.openai.requestCount)} requests · ${formatCompactNumber(providerUsage.openai.failedRequests)} failed`}
          />
          <Tile
            label="Gemini"
            accent="indigo"
            icon={Cpu}
            value={formatCompactNumber(providerUsage.gemini.totalTokens)}
            hint={`${formatCompactNumber(providerUsage.gemini.requestCount)} requests · ${formatCompactNumber(providerUsage.gemini.failedRequests)} failed`}
          />
          <Tile
            label="All providers"
            accent="amber"
            icon={Database}
            value={formatCompactNumber(providerTokensInWindow)}
            hint={`${formatCompactNumber(providerUsage.ordered.reduce((sum, item) => sum + item.requestCount, 0))} requests across ${liveWindowLabel}`}
          />
        </div>

        {providerUsage.ordered.length > 0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {providerUsage.ordered.map((item) => (
              <div
                key={item.provider}
                className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]"
              >
                <div className="flex items-center justify-between gap-3">
                  <Pill
                    variant={providerVariant[item.provider] ?? "sky"}
                    icon={Database}
                  >
                    {formatAdminProviderLabel(item.provider)}
                  </Pill>
                  <span className="font-heading text-lg font-bold text-slate-900">
                    {formatCompactNumber(item.totalTokens)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
                  <span>{formatCompactNumber(item.requestCount)} requests</span>
                  <span>•</span>
                  <span>
                    {formatCompactNumber(item.successfulRequests)} success
                  </span>
                  <span>•</span>
                  <span>{formatCompactNumber(item.failedRequests)} failed</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>

      {/* Pressure chart + infra */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <SectionHead
            eyebrow="Live pressure"
            eyebrowIcon={Flame}
            eyebrowTone="rose"
            title={`Live pressure over ${liveWindowLabel}`}
            description="Split into volume and rate views so large success bursts do not flatten failures or guest traffic."
            trailing={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <RangeChipGroup
                  value={liveWindowMinutes}
                  options={LIVE_WINDOW_OPTIONS.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                  onChange={(value) =>
                    setLiveWindowMinutes(
                      value as (typeof LIVE_WINDOW_OPTIONS)[number]["value"],
                    )
                  }
                />
                <Pill
                  variant={pressureVariant[live.pressureLevel] ?? "neutral"}
                  icon={Gauge}
                >
                  {live.pressureLevel} · {live.pressureScore.toFixed(0)}
                </Pill>
              </div>
            }
          />
          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Tile
              accent="indigo"
              icon={Activity}
              label="Peak success / min"
              value={formatCompactNumber(
                pressureHighlights.peakSuccess?.success ?? 0,
              )}
              hint={
                pressureHighlights.peakSuccess
                  ? `At ${pressureHighlights.peakSuccess.label}`
                  : "No successful traffic yet"
              }
            />
            <Tile
              accent="rose"
              icon={AlertTriangle}
              label="Peak failed / min"
              value={formatCompactNumber(
                pressureHighlights.peakFailed?.failed ?? 0,
              )}
              hint={
                pressureHighlights.peakFailed
                  ? `At ${pressureHighlights.peakFailed.label}`
                  : "No failures in the window"
              }
            />
            <Tile
              accent="amber"
              icon={Globe2}
              label="Peak guest / min"
              value={formatCompactNumber(
                pressureHighlights.peakGuests?.guests ?? 0,
              )}
              hint={
                pressureHighlights.peakGuests
                  ? `At ${pressureHighlights.peakGuests.label}`
                  : "No guest traffic yet"
              }
            />
            <Tile
              accent="emerald"
              icon={Clock}
              label="Latest minute"
              value={formatCompactNumber(
                pressureHighlights.latest?.totalTraffic ?? 0,
              )}
              hint={
                pressureHighlights.latest
                  ? `${pressureHighlights.latest.failureRatePercent.toFixed(1)}% failed · ${pressureHighlights.latest.guestSharePercent.toFixed(1)}% guest share`
                  : "Awaiting fresh traffic"
              }
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-heading text-base font-bold text-slate-900">
                    Request volume per minute
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Absolute request counts for successful, failed, and guest
                    traffic.
                  </p>
                </div>
                <Pill variant="neutral">Counts</Pill>
              </div>

              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pressureSeries}>
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
                      minTickGap={28}
                    />
                    <YAxis
                      stroke={chartTheme.axis}
                      fontSize={chartTheme.axisFont}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: "Requests / min",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: chartTheme.axis, fontSize: 12 },
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) {
                          return null;
                        }

                        const rows = payload
                          .filter((entry) => Number(entry.value ?? 0) > 0)
                          .map((entry) => ({
                            label: String(entry.name ?? "Series"),
                            value: formatCompactNumber(
                              Number(entry.value ?? 0),
                            ),
                            color: entry.color ?? chartTheme.palette.indigo,
                          }));

                        const trafficPoint = pressureSeries.find(
                          (point) => point.label === label,
                        );

                        if (trafficPoint) {
                          rows.push({
                            label: "Total traffic",
                            value: formatCompactNumber(
                              trafficPoint.totalTraffic,
                            ),
                            color: chartTheme.palette.ink,
                          });
                        }

                        return (
                          <ChartTooltipCard
                            title={`${label} volume`}
                            subtitle="Requests in this minute"
                            rows={rows}
                          />
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: chartTheme.axis }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="success"
                      name="Success"
                      fill={chartTheme.palette.indigo}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={18}
                    />
                    <Bar
                      dataKey="failed"
                      name="Failed"
                      fill={chartTheme.palette.rose}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={18}
                    />
                    <Bar
                      dataKey="guests"
                      name="Guests"
                      fill={chartTheme.palette.amber}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-heading text-base font-bold text-slate-900">
                    Failure and guest mix
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Normalized percentages so quiet failure bursts still stand
                    out during traffic spikes.
                  </p>
                </div>
                <Pill variant="neutral">Rates</Pill>
              </div>

              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pressureSeries}>
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
                      minTickGap={28}
                    />
                    <YAxis
                      stroke={chartTheme.axis}
                      fontSize={chartTheme.axisFont}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      label={{
                        value: "% of traffic",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: chartTheme.axis, fontSize: 12 },
                      }}
                    />
                    <Tooltip
                      cursor={{ stroke: chartTheme.grid }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) {
                          return null;
                        }

                        const rows = payload.map((entry) => ({
                          label: String(entry.name ?? "Series"),
                          value: `${Number(entry.value ?? 0).toFixed(1)}%`,
                          color: entry.color ?? chartTheme.palette.indigo,
                        }));

                        return (
                          <ChartTooltipCard
                            title={`${label} rates`}
                            subtitle="Share and failure mix"
                            rows={rows}
                          />
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: chartTheme.axis }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="failureRatePercent"
                      name="Failure rate"
                      stroke={chartTheme.palette.rose}
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="guestSharePercent"
                      name="Guest share"
                      stroke={chartTheme.palette.amber}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
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
          trailing={
            <RangeChipGroup
              value={trendDays}
              options={TREND_WINDOW_OPTIONS.map((value) => ({
                label: `${value}d`,
                value,
              }))}
              onChange={(value) =>
                setTrendDays(value as (typeof TREND_WINDOW_OPTIONS)[number])
              }
            />
          }
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
                label={{
                  value: "Events / day",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: chartTheme.axis, fontSize: 12 },
                }}
              />
              <Tooltip
                cursor={{ fill: "rgba(16, 185, 129, 0.06)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }

                  const point = trendChart.find((entry) => entry.day === label);

                  return (
                    <ChartTooltipCard
                      title={point?.fullDay ?? String(label ?? "Trend")}
                      subtitle="Daily throughput"
                      rows={[
                        {
                          label: "Rewrites",
                          value: formatCompactNumber(
                            Number(payload[0]?.value ?? 0),
                          ),
                          color: chartTheme.palette.sky,
                        },
                        {
                          label: "Failed",
                          value: formatCompactNumber(
                            Number(payload[1]?.value ?? 0),
                          ),
                          color: chartTheme.palette.rose,
                        },
                        {
                          label: "New users",
                          value: formatCompactNumber(
                            Number(payload[2]?.value ?? 0),
                          ),
                          color: chartTheme.palette.emerald,
                        },
                        {
                          label: "Failure rate",
                          value: `${point?.failureRatePercent.toFixed(1) ?? "0.0"}%`,
                          color: chartTheme.palette.ink,
                        },
                      ]}
                    />
                  );
                }}
              />
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
              <li key={item.requestId}>
                <Link
                  to={`/users?user=${item.userId}`}
                  className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-indigo-50/40"
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
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                      <Pill
                        variant={
                          providerVariant[
                            normalizeAdminProvider(item.provider)
                          ] ?? "sky"
                        }
                      >
                        {formatAdminProviderLabel(item.provider)}
                      </Pill>
                      <span>
                        {formatCompactNumber(item.totalTokens)} tokens
                      </span>
                      <span>•</span>
                      <span>
                        {formatCompactNumber(item.creditsConsumed)} credits
                      </span>
                      {item.errorMessage ? (
                        <>
                          <span>•</span>
                          <span className="truncate text-rose-600">
                            {item.errorMessage}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Pill variant={statusVariant[item.status] ?? "neutral"}>
                      {item.status}
                    </Pill>
                    <span className="text-[11px] font-medium text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function formatLiveWindowLabel(windowMinutes: number) {
  if (windowMinutes >= 1440) {
    return `${Math.round(windowMinutes / 1440)} day`;
  }

  if (windowMinutes >= 60) {
    const hours = windowMinutes / 60;
    return `${hours}h`;
  }

  return `${windowMinutes}m`;
}

function RangeChipGroup<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-900 p-1 text-[11px] font-semibold text-slate-300 shadow-inner">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 transition ${
            value === option.value
              ? "bg-slate-50 text-slate-900 shadow"
              : "hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ChartTooltipCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle?: string;
  rows: Array<{ label: string; value: string; color: string }>;
}) {
  return (
    <div className="min-w-52 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      {subtitle ? (
        <div className="mt-0.5 text-[11px] font-medium text-slate-500">
          {subtitle}
        </div>
      ) : null}
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div
            key={`${row.label}-${row.value}`}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <span>{row.label}</span>
            </div>
            <span className="font-semibold text-slate-900">{row.value}</span>
          </div>
        ))}
      </div>
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
