import { create } from "zustand";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "member" | "admin";
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const read = (): { token: string | null; user: AuthUser | null } => {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return token && user ? { token, user } : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
};

// Session lives in localStorage so it survives reloads; the store is the single source for components.
export const useAuthStore = create<AuthState>((set) => ({
  ...read(),
  setSession: (token, user) => {
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    } catch {
      /* storage unavailable: keep in-memory session */
    }
    set({ token, user });
  },
  logout: () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {
      /* ignore */
    }
    set({ token: null, user: null });
  },
}));

export const isAdmin = (user: AuthUser | null) => user?.role === "admin";
