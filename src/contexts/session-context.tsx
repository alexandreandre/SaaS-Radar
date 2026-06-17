"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type SessionContextValue = {
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  isAuthenticated = false,
  isAdmin = false,
}: {
  children: ReactNode;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}) {
  const value = useMemo(
    () => ({ isAuthenticated, isAdmin }),
    [isAuthenticated, isAdmin]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
