import { useQuery } from "@tanstack/react-query";
import {
  Activity,
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
  Area,
  AreaChart,
  CartesianGrid,
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
  SectionHead,
  Tile,
  chartTheme,
} from "../components/ui";
import { getApiErrorMessage, getRecentRewrites } from "../lib/api";
import { formatCompactNumber, formatDateTime } from "../lib/format";

const statusPillVariant: Record<string, "emerald" | "amber" | "rose"> = {
  SUCCESS: "emerald",
  PENDING: "amber",
  FAILED: "rose",
};

export function RewritesPage() {
  const [filter, setFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");
  const [query, setQuery] = useState("");

  const rewritesQuery = useQuery({
    queryKey: ["admin", "rewrites", "recent"],
    queryFn: () => getRecentRewrites(40),
    refetchInterval: 20_000,
  });

  const filtered = useMemo(() => {
    const all = rewritesQuery.data ?? [];
    const lc = query.trim().toLowerCase();
    return all.filter((item) => {
      if (filter !== "ALL" && item.status !== filter) return false;
      if (!lc) return true;
      return (
        item.userEmail.toLowerCase().includes(lc) ||
        item.requestType.toLowerCase().includes(lc) ||
        (item.tone ?? "").toLowerCase().includes(lc)
      );
    });
  }, [rewritesQuery.data, filter, query]);

  const chartData = useMemo(
    () =>
      (rewritesQuery.data ?? [])
        .slice()
        .reverse()
        .map((item, index) => ({
          label: `${index + 1}`,
          tokens: item.totalTokens,
        })),
    [rewritesQuery.data],
  );

  const totals = useMemo(() => {
    const all = rewritesQuery.data ?? [];
    return {
      total: all.length,
      success: all.filter((item) => item.status === "SUCCESS").length,
      failed: all.filter((item) => item.status === "FAILED").length,
      tokens: all.reduce((sum, item) => sum + item.totalTokens, 0),
    };
  }, [rewritesQuery.data]);

  if (rewritesQuery.isLoading) {
    return <LoadingShell label="Loading rewrite activity…" />;
  }
  if (rewritesQuery.error || !rewritesQuery.data) {
    return <ErrorShell message={getApiErrorMessage(rewritesQuery.error)} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
      </div>

      <Panel>
        <SectionHead
          eyebrow="Live pulse"
          eyebrowIcon={Activity}
          eyebrowTone="indigo"
          title="Token usage across recent requests"
          description="Order is newest → oldest. Use this to spot bursts or drops in provider cost."
          trailing={<Pill variant="indigo">Auto-refresh 20s</Pill>}
        />
        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="rewritesGradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={chartTheme.palette.indigo}
                    stopOpacity={0.45}
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
              <XAxis dataKey="label" hide />
              <YAxis
                stroke={chartTheme.axis}
                tickLine={false}
                axisLine={false}
                fontSize={chartTheme.axisFont}
              />
              <Tooltip
                contentStyle={chartTheme.tooltip}
                cursor={{ stroke: chartTheme.grid }}
              />
              <Area
                type="monotone"
                dataKey="tokens"
                fill="url(#rewritesGradient)"
                stroke={chartTheme.palette.indigo}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="p-0">
        <div className="border-b border-slate-200/70 p-6">
          <SectionHead
            eyebrow="Request stream"
            eyebrowIcon={Filter}
            title="Latest rewrite and reply events"
            description="Filter live to investigate failures, surges, or specific tones."
            trailing={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="search"
                    placeholder="Filter by user or tone"
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
        </div>

        <div className="max-h-[34rem] overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-900 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
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
                    colSpan={5}
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
