import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AtSign,
  Ban,
  CalendarClock,
  CheckCircle2,
  PauseCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
import {
  getApiErrorMessage,
  getOverview,
  getUserDetail,
  getUserRequests,
  getUsers,
  updateUserModeration,
} from "../lib/api";
import {
  formatAdminProviderLabel,
  formatCompactNumber,
  formatDate,
  formatDateTime,
  initials,
  normalizeAdminProvider,
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

const requestStatusVariant: Record<string, PillVariant> = {
  SUCCESS: "emerald",
  PENDING: "amber",
  FAILED: "rose",
};

const providerVariant: Record<string, PillVariant> = {
  openai: "emerald",
  gemini: "indigo",
  unknown: "neutral",
};

const accountStatusVariant: Record<string, PillVariant> = {
  ACTIVE: "emerald",
  SUSPENDED: "amber",
  BANNED: "rose",
};

type ModerationStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

const DIRECTORY_LIMIT_OPTIONS = [50, 100, 250] as const;
const REQUEST_WINDOW_OPTIONS = [7, 30, 90] as const;

export function UsersPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    searchParams.get("user"),
  );
  const [directoryLimit, setDirectoryLimit] =
    useState<(typeof DIRECTORY_LIMIT_OPTIONS)[number]>(100);
  const [requestWindowDays, setRequestWindowDays] =
    useState<(typeof REQUEST_WINDOW_OPTIONS)[number]>(30);

  const overviewQuery = useQuery({
    queryKey: ["admin", "overview", "users-page"],
    queryFn: getOverview,
    refetchInterval: 120_000,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users", query, directoryLimit],
    queryFn: () => getUsers(query, directoryLimit),
    refetchInterval: 60_000,
  });

  const userDetailQuery = useQuery({
    queryKey: ["admin", "user-detail", selectedUserId],
    queryFn: () => getUserDetail(selectedUserId as string),
    enabled: Boolean(selectedUserId),
  });

  const userRequestsQuery = useQuery({
    queryKey: ["admin", "user-requests", selectedUserId, requestWindowDays],
    queryFn: () =>
      getUserRequests(selectedUserId as string, 20, requestWindowDays),
    enabled: Boolean(selectedUserId),
    refetchInterval: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "risk-signals"] });
    },
  });

  const list = usersQuery.data ?? [];

  useEffect(() => {
    const requestedUserId = searchParams.get("user");

    if (requestedUserId && requestedUserId !== selectedUserId) {
      setSelectedUserId(requestedUserId);
    }
  }, [searchParams, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId && list.length > 0) {
      handleSelectUser(list[0].userId);
    }
  }, [list, selectedUserId]);

  const stats = useMemo(() => {
    const paid = list.filter(
      (u) => u.subscriptionKind?.toUpperCase() === "PAID",
    ).length;
    const trial = list.filter(
      (u) => u.subscriptionKind?.toUpperCase() === "TRIAL",
    ).length;
    return {
      paid,
      trial,
      total: list.length,
      free: list.length - paid - trial,
      directory: overviewQuery.data?.totalUsers ?? list.length,
    };
  }, [list, overviewQuery.data]);

  function handleSelectUser(userId: string) {
    setSelectedUserId(userId);

    const next = new URLSearchParams(searchParams);
    next.set("user", userId);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Tile
          label="Loaded"
          accent="indigo"
          icon={Users}
          value={formatCompactNumber(stats.total)}
          hint={`Showing up to ${formatCompactNumber(directoryLimit)} accounts`}
        />
        <Tile
          label="Directory"
          accent="slate"
          icon={UserRound}
          value={formatCompactNumber(stats.directory)}
          hint="Search spans the full account base"
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
          value={formatCompactNumber(stats.free)}
          hint="No paid plan"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="flex max-h-none min-h-0 flex-col overflow-hidden p-0 xl:sticky xl:top-5 xl:max-h-[calc(100vh-7rem)]">
          <div className="border-b border-slate-200/70 p-6">
            <SectionHead
              eyebrow="Directory"
              eyebrowIcon={Users}
              title="Accounts"
              description=""
              trailing={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <Search size={14} className="text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search every user by email or name"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="w-60 bg-transparent text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <OptionChipGroup
                    value={directoryLimit}
                    options={DIRECTORY_LIMIT_OPTIONS.map((value) => ({
                      label: `${value}`,
                      value,
                    }))}
                    onChange={(value) =>
                      setDirectoryLimit(
                        value as (typeof DIRECTORY_LIMIT_OPTIONS)[number],
                      )
                    }
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
            <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
              {list.map((user) => {
                const active = user.userId === selectedUserId;
                return (
                  <li key={user.userId}>
                    <button
                      type="button"
                      onClick={() => handleSelectUser(user.userId)}
                      className={`flex w-full items-center gap-4 px-6 py-4 text-left transition-colors ${
                        active
                          ? "bg-sky-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-800">
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
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                          <span>{user.currentPlanName ?? "Free plan"}</span>
                          <span>•</span>
                          <span>
                            {user.creditsRemaining == null
                              ? "Credits unavailable"
                              : `${formatCompactNumber(user.creditsRemaining)} credits`}
                          </span>
                          <span>•</span>
                          <span>Created {formatDate(user.createdAt)}</span>
                          <span>•</span>
                          <span>
                            {user.historyEnabled ? "History on" : "History off"}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {user.accountStatus !== "ACTIVE" ? (
                          <Pill
                            variant={
                              accountStatusVariant[user.accountStatus] ??
                              "neutral"
                            }
                          >
                            {user.accountStatus}
                          </Pill>
                        ) : null}
                        <Pill variant={subscriptionPill(user.subscriptionKind)}>
                          {user.subscriptionKind || "FREE"}
                        </Pill>
                        {user.currentPlanName ? (
                          <span className="text-[10px] font-semibold text-slate-500">
                            {user.currentPlanName}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel className="self-start">
          <SectionHead
            eyebrow="Account detail"
            eyebrowIcon={UserRound}
            eyebrowTone="emerald"
            title={selectedUserId ? "Account profile" : "Select an account"}
            description={
              selectedUserId
                ? "Live snapshot of plan, credits, lifecycle, and the user’s recent request activity."
                : "Pick a user on the left or jump here from the live request stream."
            }
          />

          <div className="mt-6">
            {!selectedUserId ? (
              <EmptyShell
                title="Nothing selected"
                description="Pick a user to inspect their plan, credits, and request history."
              />
            ) : userDetailQuery.isLoading ? (
              <LoadingShell label="Loading user…" />
            ) : userDetailQuery.error || !userDetailQuery.data ? (
              <ErrorShell message={getApiErrorMessage(userDetailQuery.error)} />
            ) : (
              <UserDetailView
                detail={userDetailQuery.data}
                requests={userRequestsQuery.data ?? []}
                requestsLoading={userRequestsQuery.isLoading}
                requestWindowDays={requestWindowDays}
                moderationPending={
                  moderationMutation.isPending &&
                  moderationMutation.variables?.userId ===
                    userDetailQuery.data.userId
                }
                moderationError={moderationMutation.error}
                onRequestWindowChange={(value) =>
                  setRequestWindowDays(
                    value as (typeof REQUEST_WINDOW_OPTIONS)[number],
                  )
                }
                onModerate={(payload) => moderationMutation.mutate(payload)}
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function UserDetailView({
  detail,
  requests,
  requestsLoading,
  requestWindowDays,
  moderationPending,
  moderationError,
  onRequestWindowChange,
  onModerate,
}: {
  detail: ReturnType<typeof Object> extends never
    ? never
    : Awaited<ReturnType<typeof getUserDetail>>;
  requests: Awaited<ReturnType<typeof getUserRequests>>;
  requestsLoading: boolean;
  requestWindowDays: (typeof REQUEST_WINDOW_OPTIONS)[number];
  moderationPending: boolean;
  moderationError: unknown;
  onRequestWindowChange: (
    value: (typeof REQUEST_WINDOW_OPTIONS)[number],
  ) => void;
  onModerate: (payload: {
    userId: string;
    accountStatus: ModerationStatus;
    reason: string;
  }) => void;
}) {
  const latestRequest = requests[0] ?? null;
  const [nextStatus, setNextStatus] = useState<ModerationStatus | null>(null);
  const [reason, setReason] = useState("");
  const needsReason = nextStatus !== null && nextStatus !== "ACTIVE";

  function applyModeration() {
    if (!nextStatus) return;
    if (needsReason && !reason.trim()) return;
    onModerate({
      userId: detail.userId,
      accountStatus: nextStatus,
      reason: reason.trim(),
    });
    setNextStatus(null);
    setReason("");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-sky-50 font-heading text-base font-bold text-sky-800">
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
                <Pill
                  variant={
                    accountStatusVariant[detail.accountStatus] ?? "neutral"
                  }
                >
                  {detail.accountStatus}
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

          <div className="flex shrink-0 flex-wrap gap-2">
            {detail.role === "USER" && detail.accountStatus === "ACTIVE" ? (
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
            ) : detail.role === "USER" ? (
              <button
                type="button"
                onClick={() => setNextStatus("ACTIVE")}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <CheckCircle2 size={14} />
                Restore
              </button>
            ) : null}
          </div>
        </div>

        {detail.moderationReason ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            {detail.moderationReason}
            {detail.moderatedAt ? (
              <span className="ml-2 text-amber-700">
                {formatDateTime(detail.moderatedAt)}
              </span>
            ) : null}
          </div>
        ) : null}

        {moderationError ? (
          <div className="mt-4">
            <ErrorShell message={getApiErrorMessage(moderationError)} />
          </div>
        ) : null}

        {nextStatus ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
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
                  disabled={moderationPending || (needsReason && !reason.trim())}
                  onClick={applyModeration}
                  className="h-10 rounded-md border border-slate-900 bg-slate-900 px-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ) : null}
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
        <Tile
          accent="emerald"
          label={`${requestWindowDays}-day requests`}
          value={formatCompactNumber(requests.length)}
        />
        <Tile
          accent="rose"
          label="Latest request"
          value={latestRequest ? formatDateTime(latestRequest.createdAt) : "—"}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
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

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <Activity size={11} />
              Recent requests
            </div>
            <h4 className="mt-2 font-heading text-lg font-bold text-slate-900">
              User request history
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Most recent rewrite and reply requests for this account within the
              selected window.
            </p>
          </div>
          <OptionChipGroup
            value={requestWindowDays}
            options={REQUEST_WINDOW_OPTIONS.map((value) => ({
              label: `${value}d`,
              value,
            }))}
            onChange={(value) =>
              onRequestWindowChange(
                value as (typeof REQUEST_WINDOW_OPTIONS)[number],
              )
            }
          />
        </div>

        <div className="mt-4">
          {requestsLoading ? (
            <LoadingShell label="Loading requests…" />
          ) : requests.length === 0 ? (
            <EmptyShell
              title="No recent requests"
              description="This user has no rewrite or reply activity in the current request window."
            />
          ) : (
            <div className="space-y-2">
              {requests.map((request) => (
                <div
                  key={request.requestId}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold capitalize text-slate-900">
                          {request.requestType
                            .replaceAll("_", " ")
                            .toLowerCase()}
                        </span>
                        <Pill
                          variant={
                            requestStatusVariant[request.status] ?? "neutral"
                          }
                        >
                          {request.status}
                        </Pill>
                        <Pill
                          variant={
                            providerVariant[
                              normalizeAdminProvider(request.provider)
                            ] ?? "sky"
                          }
                        >
                          {formatAdminProviderLabel(request.provider)}
                        </Pill>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                        <span>
                          {request.tone ?? request.rewriteMode ?? "general"}
                        </span>
                        <span>•</span>
                        <span>
                          {formatCompactNumber(request.totalTokens)} tokens
                        </span>
                        <span>•</span>
                        <span>
                          {formatCompactNumber(request.creditsConsumed)} credits
                        </span>
                      </div>
                      {request.errorMessage ? (
                        <div className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                          {request.errorMessage}
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-xs font-medium text-slate-500">
                      {formatDateTime(request.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionChipGroup<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-[11px] font-semibold text-slate-600">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            value === option.value
              ? "bg-slate-900 text-white"
              : "hover:bg-white hover:text-slate-900"
          }`}
        >
          {option.label}
        </button>
      ))}
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
