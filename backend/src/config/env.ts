import * as dotenv from "dotenv";

dotenv.config();

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name} (see backend/.env.example)`);
    }
    return value;
};

export const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "5000", 10),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
    // Refresh tokens are opaque, stored hashed, and rotated on every use.
    REFRESH_TOKEN_TTL_DAYS: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "30", 10),
    // Email verification codes.
    VERIFICATION_CODE_TTL_MIN: parseInt(process.env.VERIFICATION_CODE_TTL_MIN || "15", 10),
    // Adapters (SPEC D-004): "console" logs emails, "resend" sends them. Geocoding needs a Mapbox token.
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "console",
    EMAIL_FROM: process.env.EMAIL_FROM || "CREH <onboarding@resend.dev>",
    RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || "",
    // Rate limiting can be disabled for manual load/regression runs.
    RATE_LIMIT_ENABLED: (process.env.RATE_LIMIT_ENABLED ?? "true") === "true",
    // Comma separated list of allowed browser origins.
    CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()),
    // Dev-only helpers (e.g. POST /api/resources/seed) are mounted only when true.
    ENABLE_DEV_ROUTES:
        (process.env.ENABLE_DEV_ROUTES ?? (process.env.NODE_ENV === "production" ? "false" : "true")) === "true",
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

export const isProd = env.NODE_ENV === "production";
