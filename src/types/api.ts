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
  subscriberCount: number;
}

export interface AdminOverview {
  totalUsers: number;
  usersCreatedLast24Hours: number;
  activeSubscriptions: number;
  rewritesLast24Hours: number;
  failedRewritesLast24Hours: number;
  guestRequestsLast24Hours: number;
  activeMinuteBuckets: number;
  activeDayBuckets: number;
  activeSubscriptionsByPlan: AdminPlanSummary[];
}

export interface AdminTrendPoint {
  day: string;
  newUsers: number;
  rewrites: number;
  failedRewrites: number;
  guestRequests: number;
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
