import axios from "axios";
import { useAuthStore } from "../stores/authStore";

// Single axios instance: base URL, bearer token, and global 401 handling.
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url: string = error.config?.url ?? "";
    const isAuthCall = url.startsWith("/auth/");
    // An expired/invalid session: clear it and send the user to sign in (login/register 401s are normal errors).
    if (error.response?.status === 401 && !isAuthCall && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/auth") window.location.assign("/auth");
    }
    return Promise.reject(error);
  }
);

export const apiError = (e: any, fallback: string): string => e?.response?.data?.error || fallback;
