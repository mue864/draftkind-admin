import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarRange,
  Cpu,
  Database,
  Filter,
  Hash,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel } from "../components/panel";
import {
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
  getRecentRewrites,
  getRewriteProviderUsage,
} from "../lib/api";
import {
  formatAdminProviderLabel,
  formatCompactNumber,
  formatDateTime,
  normalizeAdminProvider,
} from "../lib/format";

const REWRITE_WINDOW_OPTIONS = [
  { label: "24h", value: 1 },
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

const statusPillVariant: Record<string, "emerald" | "amber" | "rose"> = {
  SUCCESS: "emerald",
  PENDING: "amber",
  FAILED: "rose",
};

const providerPillVariant: Record<string, PillVariant> = {
  openai: "emerald",
  gemini: "indigo",
  unknown: "neutral",
};

type ProviderSummary = {
  requestCount: number;
  success: number;
  failed: number;
  tokens: number;
};

const emptyProviderSummary: ProviderSummary = {
  requestCount: 0,
  success: 0,
  failed: 0,
  tokens: 0,
};

export function RewritesPage() {
  const [filter, setFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [windowDays, setWindowDays] =
    useState<(typeof REWRITE_WINDOW_OPTIONS)[number]["value"]>(7);

  const rewritesQuery = useQuery({
    queryKey: ["admin", "rewrites", "recent", windowDays],
    queryFn: () => getRecentRewrites(120, windowDays),
    refetchInterval: 20_000,
  });
  const providerUsageQuery = useQuery({
    queryKey: ["admin", "rewrites", "provider-usage", windowDays],
    queryFn: () => getRewriteProviderUsage(windowDays),
    refetchInterval: 20_000,
  });

  const providerTotals = useMemo(() => {
    const grouped = new Map<string, ProviderSummary>();

    for (const item of providerUsageQuery.data ?? []) {
      const provider = normalizeAdminProvider(item.provider);
      grouped.set(provider, {
        requestCount: item.requestCount,
        success: item.successfulRequests,
        failed: item.failedRequests,
        tokens: item.totalTokens,
      });
    }

    return grouped;
  }, [providerUsageQuery.data]);

  const providerOptions = useMemo(() => {
    const dynamicProviders = Array.from(providerTotals.keys())
      .filter((provider) => provider !== "openai" && provider !== "gemini")
      .sort();

    return ["ALL", "openai", "gemini", ...dynamicProviders];
  }, [providerTotals]);

  const filtered = useMemo(() => {
    const all = rewritesQuery.data ?? [];
    const lc = query.trim().toLowerCase();

    return all.filter((item) => {
      if (filter !== "ALL" && item.status !== filter) return false;
      if (
        providerFilter !== "ALL" &&
        normalizeAdminProvider(item.provider) !== providerFilter
      ) {
        return false;
      }
      if (!lc) return true;

      return (
        item.userEmail.toLowerCase().includes(lc) ||
        item.requestType.toLowerCase().includes(lc) ||
        (item.tone ?? "").toLowerCase().includes(lc) ||
        formatAdminProviderLabel(item.provider).toLowerCase().includes(lc)
      );
    });
  }, [rewritesQuery.data, filter, providerFilter, query]);

  const providerChartData = useMemo(
    () =>
      Array.from(providerTotals.entries())
        .map(([provider, summary]) => ({
          provider,
          label: formatAdminProviderLabel(provider),
          tokens: summary.tokens,
          requests: summary.requestCount,
          success: summary.success,
          failed: summary.failed,
        }))
        .sort(
          (left, right) =>
            right.tokens - left.tokens ||
            right.requests - left.requests ||
            left.label.localeCompare(right.label),
        ),
    [providerTotals],
  );

  const filteredTotals = useMemo(
    () => ({
      total: filtered.length,
      tokens: filtered.reduce((sum, item) => sum + item.totalTokens, 0),
    }),
    [filtered],
  );

  const openaiSummary = providerTotals.get("openai") ?? emptyProviderSummary;
  const geminiSummary = providerTotals.get("gemini") ?? emptyProviderSummary;
  const totals = useMemo(() => {
    const all = Array.from(providerTotals.values());
    return {
      total: all.reduce((sum, item) => sum + item.requestCount, 0),
      success: all.reduce((sum, item) => sum + item.success, 0),
      failed: all.reduce((sum, item) => sum + item.failed, 0),
      tokens: all.reduce((sum, item) => sum + item.tokens, 0),
    };
  }, [providerTotals]);

  if (rewritesQuery.isLoading || providerUsageQuery.isLoading) {
    return <LoadingShell label="Loading rewrite activity…" />;
  }
  if (rewritesQuery.error || !rewritesQuery.data) {
    return <ErrorShell message={getApiErrorMessage(rewritesQuery.error)} />;
  }
  if (providerUsageQuery.error || !providerUsageQuery.data) {
    return (
      <ErrorShell message={getApiErrorMessage(providerUsageQuery.error)} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Tile
          label="Tracked"
          accent="indigo"
          icon={Activity}
          value={formatCompactNumber(totals.total)}
          hint="Recent authenticated rewrite events"
        />
        <Tile
          label="Success"
          accent="emerald"
          icon={Sparkles}
          value={formatCompactNumber(totals.success)}
          hint="Completed and delivered"
        />
        <Tile
          label="Failed"
          accent="rose"
          icon={Cpu}
          value={formatCompactNumber(totals.failed)}
          hint="Errored or aborted before delivery"
        />
        <Tile
          label="Tokens used"
          accent="amber"
          icon={Hash}
          value={formatCompactNumber(totals.tokens)}
          hint="Total provider tokens in this window"
        />
        <Tile
          label="OpenAI tokens"
          accent="emerald"
          icon={Sparkles}
          value={formatCompactNumber(openaiSummary.tokens)}
          hint={`${formatCompactNumber(openaiSummary.requestCount)} requests · ${formatCompactNumber(openaiSummary.failed)} failed`}
        />
        <Tile
          label="Gemini tokens"
          accent="indigo"
          icon={Database}
          value={formatCompactNumber(geminiSummary.tokens)}
          hint={`${formatCompactNumber(geminiSummary.requestCount)} requests · ${formatCompactNumber(geminiSummary.failed)} failed`}
        />
      </div>

      <Panel>
        <SectionHead
          eyebrow="Provider split"
          eyebrowIcon={Activity}
          eyebrowTone="indigo"
          title="Provider burn across the recent window"
          description="Aggregated by provider so you can read token cost and request outcomes without decoding per-request index bars."
          trailing={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <RangeChipGroup
                value={windowDays}
                options={REWRITE_WINDOW_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                onChange={(value) =>
                  setWindowDays(
                    value as (typeof REWRITE_WINDOW_OPTIONS)[number]["value"],
                  )
                }
              />
              <Pill variant="indigo">
                Range {formatRewriteWindowLabel(windowDays)}
              </Pill>
            </div>
          }
        />
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-heading text-base font-bold text-slate-900">
                  Total tokens by provider
                </h4>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Use this to compare cost concentration between OpenAI, Gemini,
                  and any fallback providers.
                </p>
              </div>
              <Pill variant="neutral">Tokens</Pill>
            </div>

            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerChartData}>
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
                  />
                  <YAxis
                    stroke={chartTheme.axis}
                    tickLine={false}
                    axisLine={false}
                    fontSize={chartTheme.axisFont}
                    label={{
                      value: "Tokens",
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

                      const point = providerChartData.find(
                        (entry) => entry.label === label,
                      );

                      return (
                        <ChartTooltipCard
                          title={`${label} token usage`}
                          subtitle={`Across ${formatRewriteWindowLabel(windowDays)}`}
                          rows={[
                            {
                              label: "Tokens",
                              value: formatCompactNumber(
                                Number(payload[0]?.value ?? 0),
                              ),
                              color: chartTheme.palette.indigo,
                            },
                            {
                              label: "Requests",
                              value: formatCompactNumber(point?.requests ?? 0),
                              color: chartTheme.palette.ink,
                            },
                          ]}
                        />
                      );
                    }}
                  />
                  <Bar
                    dataKey="tokens"
                    name="Tokens"
                    fill={chartTheme.palette.indigo}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-heading text-base font-bold text-slate-900">
                  Success vs failed by provider
                </h4>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Outcome distribution for the same recent request window.
                </p>
              </div>
              <Pill variant="neutral">Requests</Pill>
            </div>

            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerChartData}>
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
                  />
                  <YAxis
                    stroke={chartTheme.axis}
                    tickLine={false}
                    axisLine={false}
                    fontSize={chartTheme.axisFont}
                    label={{
                      value: "Requests",
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

                      const point = providerChartData.find(
                        (entry) => entry.label === label,
                      );

                      return (
                        <ChartTooltipCard
                          title={`${label} request outcomes`}
                          subtitle={`Across ${formatRewriteWindowLabel(windowDays)}`}
                          rows={[
                            {
                              label: "Success",
                              value: formatCompactNumber(
                                Number(payload[0]?.value ?? 0),
                              ),
                              color: chartTheme.palette.emerald,
                            },
                            {
                              label: "Failed",
                              value: formatCompactNumber(
                                Number(payload[1]?.value ?? 0),
                              ),
                              color: chartTheme.palette.rose,
                            },
                            {
                              label: "Total requests",
                              value: formatCompactNumber(point?.requests ?? 0),
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
                    dataKey="success"
                    name="Success"
                    fill={chartTheme.palette.emerald}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="failed"
                    name="Failed"
                    fill={chartTheme.palette.rose}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="p-0">
        <div className="border-b border-slate-200/70 p-6">
          <SectionHead
            eyebrow="Request stream"
            eyebrowIcon={Filter}
            title="Latest rewrite and reply events"
            description={`Filter by provider, status, user, or tone inside the selected ${formatRewriteWindowLabel(windowDays)} window.`}
            trailing={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  <CalendarRange size={14} className="text-slate-400" />
                  {formatRewriteWindowLabel(windowDays)}
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="search"
                    placeholder="Filter by user, tone, or provider"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-44 bg-transparent text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <div className="inline-flex rounded-xl bg-slate-900 p-1 text-[11px] font-semibold text-slate-300 shadow-inner">
                  {(["ALL", "SUCCESS", "FAILED"] as const).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFilter(label)}
                      className={`rounded-lg px-3 py-1.5 transition ${
                        filter === label
                          ? "bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow"
                          : "hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            }
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {providerOptions.map((provider) => {
              const summary =
                provider === "ALL"
                  ? {
                      requestCount: totals.total,
                      tokens: totals.tokens,
                    }
                  : (providerTotals.get(provider) ?? emptyProviderSummary);

              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setProviderFilter(provider)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    providerFilter === provider
                      ? "border-slate-900 bg-slate-900 text-white shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  <span>
                    {provider === "ALL"
                      ? "All providers"
                      : formatAdminProviderLabel(provider)}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      providerFilter === provider
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {formatCompactNumber(summary.tokens)}
                  </span>
                </button>
              );
            })}

            <Pill variant="ink">
              Showing {formatCompactNumber(filteredTotals.total)} requests ·{" "}
              {formatCompactNumber(filteredTotals.tokens)} tokens
            </Pill>
          </div>
        </div>

        <div className="max-h-[34rem] overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-900 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Tokens</th>
                <th className="px-6 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr
                  key={item.requestId}
                  className="transition-colors hover:bg-indigo-50/40"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-[11px] font-bold text-white shadow">
                        {item.userEmail.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {item.userEmail}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] capitalize text-slate-500">
                          <Tag size={10} />
                          {item.tone ?? item.rewriteMode ?? "general"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium capitalize text-slate-700">
                    {item.requestType.replaceAll("_", " ").toLowerCase()}
                  </td>
                  <td className="px-6 py-4">
                    <Pill variant={statusPillVariant[item.status] ?? "neutral"}>
                      {item.status}
                    </Pill>
                  </td>
                  <td className="px-6 py-4">
                    <Pill
                      variant={
                        providerPillVariant[
                          normalizeAdminProvider(item.provider)
                        ] ?? "sky"
                      }
                    >
                      {formatAdminProviderLabel(item.provider)}
                    </Pill>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800">
                      <Database size={11} className="text-slate-400" />
                      {formatCompactNumber(item.totalTokens)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-10 text-center text-sm text-slate-500"
                    colSpan={6}
                  >
                    No requests matched the current filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function formatRewriteWindowLabel(days: number) {
  if (days === 1) {
    return "24 hours";
  }

  return `${days} days`;
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
