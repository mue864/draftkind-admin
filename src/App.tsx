import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AdminLayout } from "./components/admin-layout";
import { AdminSessionProvider, useAdminSession } from "./hooks/use-admin-session";

const queryClient = new QueryClient();
const LoginPage = lazy(() => import("./pages/login-page").then((module) => ({ default: module.LoginPage })));
const OverviewPage = lazy(() =>
  import("./pages/overview-page").then((module) => ({ default: module.OverviewPage })),
);
const UsersPage = lazy(() => import("./pages/users-page").then((module) => ({ default: module.UsersPage })));
const RewritesPage = lazy(() =>
  import("./pages/rewrites-page").then((module) => ({ default: module.RewritesPage })),
);
const GuestUsagePage = lazy(() =>
  import("./pages/guest-usage-page").then((module) => ({ default: module.GuestUsagePage })),
);
const PlansPage = lazy(() => import("./pages/plans-page").then((module) => ({ default: module.PlansPage })));
const BillingOpsPage = lazy(() =>
  import("./pages/billing-ops-page").then((module) => ({ default: module.BillingOpsPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-500 shadow-sm">
        Loading workspace...
      </div>
    </div>
  );
}

function ProtectedApp() {
  const { isAuthenticated } = useAdminSession();

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AdminLayout />} path="/">
          <Route element={<OverviewPage />} index />
          <Route element={<UsersPage />} path="users" />
          <Route element={<RewritesPage />} path="rewrites" />
          <Route element={<PlansPage />} path="plans" />
          <Route element={<BillingOpsPage />} path="billing" />
          <Route element={<GuestUsagePage />} path="guest-usage" />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminSessionProvider>
        <BrowserRouter>
          <ProtectedApp />
        </BrowserRouter>
      </AdminSessionProvider>
    </QueryClientProvider>
  );
}
