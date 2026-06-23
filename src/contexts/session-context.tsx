"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type SessionContextValue = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** Cookie admin_gate valide — requis pour appeler les APIs admin en prefetch. */
  hasAdminGate: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  isAuthenticated = false,
  isAdmin = false,
  hasAdminGate = false,
}: {
  children: ReactNode;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  hasAdminGate?: boolean;
}) {
  const value = useMemo(
    () => ({ isAuthenticated, isAdmin, hasAdminGate }),
    [isAuthenticated, isAdmin, hasAdminGate]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
