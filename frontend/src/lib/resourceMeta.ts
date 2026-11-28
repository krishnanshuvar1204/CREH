import type { ResourceCategory } from "../types";

// Mirrors backend `ResourceCategory` / sharing radii (GET /resources/options). Kept static so forms render offline.
export const CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: "tools", label: "Tools" },
  { value: "electronics", label: "Electronics" },
  { value: "outdoors", label: "Outdoors & sports" },
  { value: "furniture", label: "Furniture" },
  { value: "kitchen", label: "Kitchen & home" },
  { value: "books", label: "Books & media" },
  { value: "other", label: "Other" },
];

export const categoryLabel = (value?: string) => CATEGORIES.find((c) => c.value === value)?.label ?? value ?? "Other";

export const RADII_M = [500, 1000, 2000, 5000] as const;
export const radiusLabel = (m: number) => (m < 1000 ? `${m} m` : `${m / 1000} km`);

export const MAX_IMAGES = 5;

// Image URLs are either absolute (CDN) or a path served by the API (/uploads/...).
const API_ORIGIN = ((import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api").replace(/\/api\/?$/, "");
export const imageSrc = (url?: string | null) => (!url ? undefined : /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`);
