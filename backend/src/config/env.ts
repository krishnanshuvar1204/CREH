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
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
    // Comma separated list of allowed browser origins.
    CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()),
    // Dev-only helpers (e.g. POST /api/resources/seed) are mounted only when true.
    ENABLE_DEV_ROUTES:
        (process.env.ENABLE_DEV_ROUTES ?? (process.env.NODE_ENV === "production" ? "false" : "true")) === "true",
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

export const isProd = env.NODE_ENV === "production";
