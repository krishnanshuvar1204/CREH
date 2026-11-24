import { create } from "zustand";
import type { VerificationStatus } from "../types";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "member" | "admin";
  verification_status: VerificationStatus;
  avatar_url?: string | null;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, refreshToken: string, user: AuthUser) => void;
  // Used by the silent refresh: swaps tokens without touching the user unless one is supplied.
  setTokens: (token: string, refreshToken: string, user?: AuthUser) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  clear: () => void;
}

interface Persisted {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

const empty: Persisted = { token: null, refreshToken: null, user: null };

const read = (): Persisted => {
  try {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    // A session without a refresh token predates Phase 1 and cannot be silently renewed.
    return token && refreshToken && user ? { token, refreshToken, user } : empty;
  } catch {
    return empty;
  }
};

const write = (s: Persisted) => {
  try {
    if (s.token && s.refreshToken && s.user) {
      localStorage.setItem("token", s.token);
      localStorage.setItem("refreshToken", s.refreshToken);
      localStorage.setItem("user", JSON.stringify(s.user));
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  } catch {
    /* storage unavailable: keep the in-memory session */
  }
};

// Session lives in localStorage so it survives reloads; the store is the single source for components.
export const useAuthStore = create<AuthState>((set, get) => ({
  ...read(),
  setSession: (token, refreshToken, user) => {
    write({ token, refreshToken, user });
    set({ token, refreshToken, user });
  },
  setTokens: (token, refreshToken, user) => {
    const next = { token, refreshToken, user: user ?? get().user };
    write(next);
    set(next);
  },
  updateUser: (patch) => {
    const { token, refreshToken, user } = get();
    if (!user) return;
    const next = { token, refreshToken, user: { ...user, ...patch } };
    write(next);
    set({ user: next.user });
  },
  clear: () => {
    write(empty);
    set(empty);
  },
}));

export const isAdmin = (user: AuthUser | null) => user?.role === "admin";
export const isEmailVerified = (user: AuthUser | null) => !!user && user.verification_status !== "unverified";
