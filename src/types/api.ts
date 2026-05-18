export interface User {
  id: string;
  email: string;
  creationDate: string;
  firstName: string;
  lastName: string;
  fullName: string;
  historyEnabled: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: User;
}

export interface AdminPlanSummary {
  planName: string;
  paidSubscriberCount: number;
  trialSubscriberCount: number;
  currentSubscriberCount: number;
}

export interface AdminOverview {
  totalUsers: number;
  usersCreatedLast24Hours: number;
  paidActiveSubscriptions: number;
  activeTrials: number;
  currentSubscriptionsTotal: number;
  rewritesLast24Hours: number;
  failedRewritesLast24Hours: number;
  guestRequestsLast24Hours: number;
  activeMinuteBuckets: number;
  activeDayBuckets: number;
  subscriptionsByPlan: AdminPlanSummary[];
}

export interface AdminTrendPoint {
  day: string;
  newUsers: number;
  rewrites: number;
  failedRewrites: number;
  guestRequests: number;
}

export interface AdminActivityMinutePoint {
  minuteStart: string;
  rewriteRequests: number;
  successfulRequests: number;
  failedRequests: number;
  pendingRequests: number;
  guestRequests: number;
}

export interface AdminFailureSignal {
  message: string;
  occurrences: number;
  latestAt: string;
}

export interface AdminInfrastructureSnapshot {
  dbPoolMaxConnections: number | null;
  dbPoolTotalConnections: number | null;
  dbPoolActiveConnections: number | null;
  dbPoolIdleConnections: number | null;
  dbPoolAwaitingConnections: number | null;
  dbPoolUsagePercent: number;
  dbQueuePressurePercent: number;
  heapUsedMegabytes: number;
  heapMaxMegabytes: number;
  heapUsagePercent: number;
  processCpuUsagePercent: number;
  systemCpuUsagePercent: number;
  httpRequestCount: number;
  httpMeanLatencyMillis: number;
  httpP95LatencyMillis: number;
}

export interface AdminTrendDelta {
  key: string;
  label: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
}

export interface AdminIncidentAlert {
  key: string;
  severity: string;
  title: string;
  summary: string;
  suggestedAction: string;
}

export interface AdminLiveActivitySnapshot {
  capturedAt: string;
  totalRequestsLast5Minutes: number;
  rewriteRequestsLast5Minutes: number;
  rewriteRequestsLast15Minutes: number;
  failedRequestsLast15Minutes: number;
  failureRateLast15Minutes: number;
  pendingRequests: number;
  stalePendingRequests: number;
  guestRequestsLast5Minutes: number;
  guestMinuteWindowRequests: number;
  activeGuestMinuteBuckets: number;
  totalTokensLast15Minutes: number;
  geminiConcurrencyLimit: number | null;
  concurrencyPressurePercent: number;
  guestPressurePercent: number;
  pressureScore: number;
  pressureLevel: string;
  pressureSummary: string;
  infrastructure: AdminInfrastructureSnapshot;
  trendDeltas: AdminTrendDelta[];
  incidentAlerts: AdminIncidentAlert[];
  minuteSeries: AdminActivityMinutePoint[];
  recentFailureSignals: AdminFailureSignal[];
  hotGuestBuckets: AdminGuestBucket[];
}

export interface AdminPlanCatalog {
  id: number;
  name: string;
  price: number;
  monthlyCredits: number;
  billingCycle: string;
  platform: string;
  active: boolean;
  maxCharactersPerRewrite: number;
  maxRewriteVersions: number;
  subjectGenerationEnabled: boolean;
  translationEnabled: boolean;
  historyEnabled: boolean;
  favoritesEnabled: boolean;
  prioritySupportEnabled: boolean;
  subjectGenerationLimit: number | null;
  translationLimit: number | null;
  allowedTones: string[];
  allowedRewriteModes: string[];
  allowedTemplates: string[];
  allowedReplyIntents: string[];
  allowedVoicePresets: string[];
  subscriberCap: number | null;
  claimedSubscriptions: number;
  paidClaimedSubscriptions: number;
  trialClaimedSubscriptions: number;
  currentClaimedSubscriptions: number;
  remainingSpots: number | null;
  soldOut: boolean;
}

export interface AdminUserListItem {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  historyEnabled: boolean;
  createdAt: string;
  currentPlanName: string | null;
  creditsRemaining: number | null;
  subscriptionStatus: string | null;
  subscriptionKind: string;
  previewEndsAt: string | null;
  premiumPreviewUsed: boolean;
}

export interface AdminUserDetail {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  historyEnabled: boolean;
  createdAt: string;
  lastUpdatedAt: string;
  totalRewriteCount: number;
  rewritesLast30Days: number;
  currentPlanName: string | null;
  creditsRemaining: number | null;
  subscriptionStatus: string | null;
  subscriptionKind: string;
  previewEndsAt: string | null;
  premiumPreviewUsed: boolean;
  subscriptionRenewalDate: string | null;
  billingPlatform: string | null;
}

export interface AdminRecentRewrite {
  requestId: number;
  userId: string;
  userEmail: string;
  requestType: string;
  status: string;
  tone: string | null;
  rewriteMode: string | null;
  creditsConsumed: number;
  provider: string;
  totalTokens: number;
  favorite: boolean;
  createdAt: string;
  errorMessage: string | null;
}

export interface AdminGuestBucket {
  bucketType: string;
  fingerprintPrefix: string;
  requestCount: number;
  windowStart: string;
  updatedAt: string;
}

export interface AdminGuestUsage {
  activeMinuteBuckets: number;
  activeDayBuckets: number;
  minuteWindowRequests: number;
  dayWindowRequests: number;
  requestsLast24Hours: number;
  hottestBuckets: AdminGuestBucket[];
}

export interface GoogleBillingDeadLetter {
  eventId: string;
  packageName: string;
  productId: string;
  basePlanId: string | null;
  purchaseToken: string;
  notificationType: string;
  status: string;
  retryCount: number;
  lastError: string | null;
  nextRetryAt: string | null;
  lastAttemptAt: string | null;
  updatedAt: string;
}

export interface GoogleBillingReplayResponse {
  recovered: boolean;
  eventId: string;
  status: string;
  message: string;
}

export interface RevenueCatBillingDeadLetter {
  eventId: string;
  appUserId: string;
  eventType: string;
  entitlementId: string | null;
  productId: string | null;
  transactionId: string | null;
  status: string;
  retryCount: number;
  lastError: string | null;
  nextRetryAt: string | null;
  lastAttemptAt: string | null;
  updatedAt: string;
}

export interface RevenueCatBillingReplayResponse {
  replayed: boolean;
  eventId: string;
  status: string;
  message: string;
}

export interface RevenueCatCatalogSyncResponse {
  plansUpdated: number;
  plansMissed: number;
  details: string[];
}
