import axios from "axios";

// Mock fallback policy (SPEC §7b): READS fall back to labelled demo data when the API is unreachable or
// failing (network error / 5xx). Writes never fall back. 4xx errors (auth, validation) are real errors.
const flag = import.meta.env.VITE_ENABLE_MOCK_FALLBACK as string | undefined;
export const MOCK_FALLBACK_ENABLED = flag === "true" || (flag !== "false" && import.meta.env.DEV);

export interface WithMock<T> {
  data: T;
  isMock: boolean;
}

const isOutage = (err: unknown) => {
  if (!axios.isAxiosError(err)) return true;
  return !err.response || err.response.status >= 500;
};

export async function withMockFallback<T>(
  fetcher: () => Promise<T>,
  mock: T | (() => T),
  opts: { fallbackOnEmpty?: boolean } = {}
): Promise<WithMock<T>> {
  const makeMock = () => (typeof mock === "function" ? (mock as () => T)() : mock);
  try {
    const data = await fetcher();
    // Dev-only convenience: an empty result set shows demo pins so the UI is never blank while developing.
    if (opts.fallbackOnEmpty && MOCK_FALLBACK_ENABLED && import.meta.env.DEV && Array.isArray(data) && data.length === 0) {
      return { data: makeMock(), isMock: true };
    }
    return { data, isMock: false };
  } catch (err) {
    if (MOCK_FALLBACK_ENABLED && isOutage(err)) return { data: makeMock(), isMock: true };
    throw err;
  }
}
