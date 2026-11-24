import axios, { type AxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";

// Single axios instance: base URL, bearer token, silent token refresh, and global 401 handling.
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Bare client for the refresh call itself so it cannot trigger the interceptor recursively.
const bare = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One refresh at a time: concurrent 401s share the same promise (refresh tokens are single-use).
let refreshing: Promise<string | null> | null = null;

const refreshSession = (): Promise<string | null> => {
  if (refreshing) return refreshing;
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return Promise.resolve(null);

  refreshing = bare
    .post("/auth/refresh", { refreshToken })
    .then((res) => {
      useAuthStore.getState().setTokens(res.data.token, res.data.refreshToken, res.data.user);
      return res.data.token as string;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

const endSession = () => {
  useAuthStore.getState().clear();
  if (window.location.pathname !== "/auth") window.location.assign("/auth");
};

type Retryable = AxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config: Retryable | undefined = error.config;
    const url: string = config?.url ?? "";
    const isAuthCall = url.startsWith("/auth/");
    const hadSession = !!useAuthStore.getState().token;

    // Expired access token: renew silently and replay the request once (login/register 401s are normal errors).
    if (error.response?.status === 401 && config && !isAuthCall && hadSession && !config._retried) {
      config._retried = true;
      const newToken = await refreshSession();
      if (newToken) {
        config.headers = { ...(config.headers as object), Authorization: `Bearer ${newToken}` } as never;
        return api(config);
      }
      endSession();
    }
    return Promise.reject(error);
  }
);

// Revokes the refresh token server-side (best effort) and clears the local session.
export const signOut = async () => {
  const { refreshToken } = useAuthStore.getState();
  useAuthStore.getState().clear();
  if (refreshToken) await bare.post("/auth/logout", { refreshToken }).catch(() => undefined);
};

export const apiError = (e: any, fallback: string): string => e?.response?.data?.error || fallback;
