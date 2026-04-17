import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { getApiErrorMessage, getRecentRewrites } from "../lib/api";
import { formatCompactNumber, formatDateTime } from "../lib/format";
import { Panel } from "../components/panel";

export function RewritesPage() {
  const rewritesQuery = useQuery({
    queryKey: ["admin", "rewrites", "recent"],
    queryFn: () => getRecentRewrites(32),
  });

  if (rewritesQuery.isLoading) {
    return <div className="flex items-center justify-center h-64 text-sm font-medium text-slate-500">Loading rewrite activity...</div>;
  }

  if (rewritesQuery.error || !rewritesQuery.data) {
    return <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">{getApiErrorMessage(rewritesQuery.error)}</div>;
  }

  const chartData = rewritesQuery.data
    .slice()
    .reverse()
    .map((item, index) => ({
      label: `${index + 1}`,
      tokens: item.totalTokens,
      credits: item.creditsConsumed,
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
        <Panel className="flex flex-col p-6">
          <div className="mb-6">
            <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">Live activity pulse</div>
            <h3 className="text-lg font-bold text-slate-800">Recent rewrite and reply load</h3>
          </div>

          <div className="w-full flex-1 min-h-[300px] mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tokenGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  }}
                  cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                />
                <Area dataKey="tokens" fill="url(#tokenGradient)" stroke="#f59e0b" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="flex h-[42rem] flex-col overflow-hidden p-0">
          <div className="p-6 border-b border-slate-200 shrink-0 bg-white">
            <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">Recent requests</div>
            <h3 className="text-lg font-bold text-slate-800">Latest rewrite and reply events</h3>
          </div>

          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tokens</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 pt-3">When</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {rewritesQuery.data.map((item) => (
                  <tr key={item.requestId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <strong className="block text-sm font-bold text-slate-900 mb-0.5">{item.userEmail}</strong>
                      <span className="block text-xs text-slate-500 capitalize">{item.tone ?? item.rewriteMode ?? "General"}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 capitalize">
                      {item.requestType.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        item.status === "SUCCESS" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                         {formatCompactNumber(item.totalTokens)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {formatDateTime(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
