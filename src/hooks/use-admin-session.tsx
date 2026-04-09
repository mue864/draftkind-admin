import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { AuthResponse } from "../types/api";
import { getOverview, isForbidden, login, setAccessToken } from "../lib/api";

const STORAGE_KEY = "draftkind.admin.session";

interface StoredSession {
  accessToken: string;
  expiresAt: string;
  user: AuthResponse["user"];
}

interface AdminSessionContextValue {
  session: StoredSession | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

function readStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);

  useEffect(() => {
    const stored = readStoredSession();
    if (!stored) {
      return;
    }

    setSession(stored);
    setAccessToken(stored.accessToken);
  }, []);

  async function signIn(email: string, password: string) {
    const auth = await login(email, password);
    setAccessToken(auth.accessToken);

    try {
      await getOverview();
    } catch (error) {
      setAccessToken(null);
      if (isForbidden(error)) {
        throw new Error("This account is authenticated but not authorized for the admin console.");
      }

      throw error;
    }

    const nextSession: StoredSession = {
      accessToken: auth.accessToken,
      expiresAt: auth.expiresAt,
      user: auth.user,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setAccessToken(null);
    setSession(null);
  }

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      signIn,
      signOut,
    }),
    [session],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }

  return context;
}
