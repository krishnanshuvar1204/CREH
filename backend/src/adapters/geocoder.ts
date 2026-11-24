import { env } from "../config/env";
import { HttpError } from "../lib/errors";

export interface GeocodeResult {
    lat: number;
    lng: number;
    label: string;
}

export interface Geocoder {
    forward(query: string): Promise<GeocodeResult | null>;
    reverse(lat: number, lng: number): Promise<string | null>;
}

// Used when no Mapbox token is configured: pins still work, address search is unavailable.
export const noopGeocoder: Geocoder = {
    async forward() {
        throw new HttpError(503, "Address search is not configured on this server. Drop a pin on the map instead.");
    },
    async reverse() {
        return null;
    },
};

export const mapboxGeocoder: Geocoder = {
    async forward(query) {
        const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&limit=1&access_token=${env.MAPBOX_ACCESS_TOKEN}`;
        const res = await fetch(url).catch(() => null);
        if (!res?.ok) throw new HttpError(502, "Geocoding service unavailable");
        const body: any = await res.json();
        const f = body.features?.[0];
        if (!f) return null;
        const [lng, lat] = f.geometry.coordinates;
        return { lat, lng, label: f.properties?.full_address || f.properties?.name || query };
    },
    async reverse(lat, lng) {
        const url = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&limit=1&access_token=${env.MAPBOX_ACCESS_TOKEN}`;
        const res = await fetch(url).catch(() => null);
        if (!res?.ok) return null;
        const body: any = await res.json();
        return body.features?.[0]?.properties?.full_address ?? null;
    },
};

export const geocoder: Geocoder = env.MAPBOX_ACCESS_TOKEN ? mapboxGeocoder : noopGeocoder;
