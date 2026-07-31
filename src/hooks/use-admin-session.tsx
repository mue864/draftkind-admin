import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  getAdminSession,
  isUnauthorized,
  login,
  logout,
  setAdminCsrfToken,
  setUnauthorizedHandler,
} from "../lib/api";
import type { AdminAuthSessionResponse } from "../types/api";

const LEGACY_STORAGE_KEY = "draftkind.admin.session";

type AdminSession = AdminAuthSessionResponse;

interface AdminSessionContextValue {
  session: AdminSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(
  null,
);

export function AdminSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY);

    let active = true;
    void getAdminSession()
      .then((nextSession) => {
        if (active) {
          setSession(nextSession);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        if (!isUnauthorized(error)) {
          console.warn("Admin session bootstrap failed", error);
        }
        setSession(null);
        setAdminCsrfToken(null);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAdminCsrfToken(null);
      setSession(null);
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  async function signIn(email: string, password: string) {
    const auth = await login(email, password);
    setSession(auth);
  }

  function signOut() {
    void logout().catch(() => {
      // Local sign-out should still proceed if the network is unavailable.
    });
    setAdminCsrfToken(null);
    setSession(null);
  }

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.user),
      isLoading,
      signIn,
      signOut,
    }),
    [isLoading, session],
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }

  return context;
}
