"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CurrentUser } from "@/lib/types";

const UserContext = createContext<CurrentUser | null>(null);

export function UserProvider({ user, children }: { user: CurrentUser | null; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/** Returns the current user or null if signed out. */
export function useCurrentUser(): CurrentUser | null {
  return useContext(UserContext);
}

/** Returns the current user, throwing if not authenticated (use on protected pages). */
export function useRequireUser(): CurrentUser {
  const user = useContext(UserContext);
  if (!user) throw new Error("useRequireUser called without a signed-in user");
  return user;
}

export function useIsAdmin(): boolean {
  return useContext(UserContext)?.role === "admin";
}

export function useCanEditProducts(): boolean {
  const role = useContext(UserContext)?.role;
  return role === "admin" || role === "price_manager";
}
