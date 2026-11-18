import * as jwt from "jsonwebtoken";
import { env } from "../config/env";
import { unauthorized } from "../lib/errors";

export interface AccessTokenPayload {
    userId: number;
}

export const signAccessToken = (userId: number): string =>
    jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
        if (typeof payload.userId !== "number") throw new Error("bad payload");
        return { userId: payload.userId };
    } catch {
        throw unauthorized("Invalid or expired token");
    }
};
