import pino from "pino";
import { env, isProd } from "../config/env";

export const logger = pino({
    level: env.LOG_LEVEL,
    redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.password_hash"],
    ...(isProd ? {} : { transport: { target: "pino-pretty", options: { colorize: true, singleLine: true } } }),
});
