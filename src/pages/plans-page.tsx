import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Crown, LockKeyhole, RefreshCw, Sparkles, Tags } from "lucide-react";

import { Panel } from "../components/panel";
import { StatCard } from "../components/stat-card";
import { deactivatePlan, getApiErrorMessage, getPlanCatalog } from "../lib/api";
import { formatCompactNumber, formatCurrency } from "../lib/format";

export function PlansPage() {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: getPlanCatalog,
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivatePlan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });

  if (plansQuery.isLoading) {
    return <div className="flex items-center justify-center h-64 text-sm font-medium text-slate-500">Loading plan catalog...</div>;
  }

  if (plansQuery.error || !plansQuery.data) {
    return <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">{getApiErrorMessage(plansQuery.error)}</div>;
  }

  const plans = plansQuery.data;
  const activePlans = plans.filter((plan) => plan.active);
  const soldOutPlans = plans.filter((plan) => plan.soldOut);
  const totalPaidClaimedSubscriptions = plans.reduce(
    (total, plan) => total + plan.paidClaimedSubscriptions,
    0,
  );
  const totalTrialOccupancy = plans.reduce(
    (total, plan) => total + plan.trialClaimedSubscriptions,
    0,
  );
  const historyEnabledPlans = plans.filter((plan) => plan.historyEnabled).length;

  const chartData = plans.map((plan) => ({
    name: plan.name,
    paidSubscribers: plan.paidClaimedSubscriptions,
    activeTrials: plan.trialClaimedSubscriptions,
    credits: plan.monthlyCredits,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          hint={`${formatCompactNumber(historyEnabledPlans)} plans include synced history`}
          icon={Crown}
          label="Active plans"
          tone="default"
          value={formatCompactNumber(activePlans.length)}
        />
        <StatCard
          hint="Plans that have exhausted their subscription cap"
          icon={LockKeyhole}
          label="Sold out plans"
          tone="rose"
          value={formatCompactNumber(soldOutPlans.length)}
        />
        <StatCard
          hint="Current paid occupancy across all plans"
          icon={Sparkles}
          label="Paid claimed"
          tone="mint"
          value={formatCompactNumber(totalPaidClaimedSubscriptions)}
        />
        <StatCard
          hint="Preview users currently occupying paid-plan access"
          icon={Sparkles}
          label="Trial occupancy"
          tone="amber"
          value={formatCompactNumber(totalTrialOccupancy)}
        />
        <StatCard
          hint="How many admin-managed plans support saved history"
          icon={Tags}
          label="History-enabled plans"
          tone="amber"
          value={formatCompactNumber(historyEnabledPlans)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel className="flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">Catalog pressure</div>
              <h3 className="text-lg font-bold text-slate-800">Paid vs trial occupancy across current plans</h3>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              <span>{plans.length} total plans</span>
            </div>
          </div>

          <div className="w-full flex-1 min-h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  }}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="paidSubscribers" stackId="occupancy" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                <Bar dataKey="activeTrials" stackId="occupancy" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <div className="mb-6">
            <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">Commercial profile</div>
            <h3 className="text-lg font-bold text-slate-800">Pricing and credit posture</h3>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: '600px' }}>
            {plans.map((plan) => (
              <article className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all" key={plan.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 font-heading mb-1">{plan.name}</h4>
                    <p className="text-sm text-slate-500 font-medium">
                      {formatCurrency(plan.price)} · <span className="capitalize">{plan.billingCycle.toLowerCase()}</span> · <span className="capitalize">{plan.platform.toLowerCase()}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${plan.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {plan.active ? "Active" : "Inactive"}
                    </span>
                    {plan.soldOut ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200">Sold out</span> : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monthly credits</span>
                    <strong className="block text-lg font-bold text-slate-900">{formatCompactNumber(plan.monthlyCredits)}</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Paid</span>
                    <strong className="block text-lg font-bold text-slate-900">{formatCompactNumber(plan.paidClaimedSubscriptions)}</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Trials</span>
                    <strong className="block text-lg font-bold text-slate-900">{formatCompactNumber(plan.trialClaimedSubscriptions)}</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remaining</span>
                    <strong className="block text-lg font-bold text-slate-900">{plan.remainingSpots == null ? "Unlimited" : formatCompactNumber(plan.remainingSpots)}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {plan.subjectGenerationEnabled ? <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">Subjects</span> : null}
                  {plan.translationEnabled ? <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">Translations</span> : null}
                  {plan.historyEnabled ? <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">History</span> : null}
                  {plan.favoritesEnabled ? <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">Favorites</span> : null}
                  {plan.prioritySupportEnabled ? <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">Priority support</span> : null}
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">{plan.maxRewriteVersions} versions</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-100 gap-4">
                  <div className="flex items-center space-x-4 text-sm font-medium text-slate-500">
                    <span>{formatCompactNumber(plan.currentClaimedSubscriptions)} current</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{plan.allowedTones.length} tones</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{plan.allowedTemplates.length} templates</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{formatCompactNumber(plan.maxCharactersPerRewrite)} max chars</span>
                  </div>

                  <button
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!plan.active || deactivateMutation.isPending}
                    onClick={() => deactivateMutation.mutate(plan.id)}
                    type="button"
                  >
                    <RefreshCw size={14} className={deactivateMutation.isPending && deactivateMutation.variables === plan.id ? "animate-spin" : ""} />
                    <span>{plan.active ? "Deactivate plan" : "Inactive"}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
