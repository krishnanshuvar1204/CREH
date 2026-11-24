import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const passthrough = (_req: Request, _res: Response, next: NextFunction) => next();

const make = (opts: { windowMinutes: number; max: number; skipSuccessfulRequests?: boolean }) =>
    !env.RATE_LIMIT_ENABLED
        ? passthrough
        : rateLimit({
              windowMs: opts.windowMinutes * 60 * 1000,
              limit: opts.max,
              standardHeaders: "draft-7",
              legacyHeaders: false,
              skipSuccessfulRequests: opts.skipSuccessfulRequests,
              handler: (_req, res) => {
                  res.status(429).json({ error: "Too many attempts. Please try again in a few minutes." });
              },
          });

// Credential guessing: only failed logins count toward the limit.
export const loginLimiter = make({ windowMinutes: 15, max: 10, skipSuccessfulRequests: true });
// Account creation / token refresh / code verification.
export const registerLimiter = make({ windowMinutes: 60, max: 10 });
export const refreshLimiter = make({ windowMinutes: 15, max: 60 });
export const verifyLimiter = make({ windowMinutes: 15, max: 20 });
