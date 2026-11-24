import * as jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { AppDataSource } from "../data-source";
import { RefreshToken } from "../entity/RefreshToken";
import { User } from "../entity/User";
import { forbidden, unauthorized } from "../lib/errors";

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

// ---- Refresh tokens: opaque, hashed at rest, rotated on every use ----

const refreshTokens = () => AppDataSource.getRepository(RefreshToken);
const hash = (raw: string) => crypto.createHash("sha256").update(raw).digest("hex");
const newRawToken = () => crypto.randomBytes(48).toString("base64url");
const expiryDate = () => new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

const issueRefreshToken = async (userId: number, familyId: string): Promise<string> => {
    const raw = newRawToken();
    await refreshTokens().insert({
        user: { id: userId } as User,
        token_hash: hash(raw),
        family_id: familyId,
        expires_at: expiryDate(),
    });
    return raw;
};

// A brand-new login/registration starts a new rotation family.
export const startSession = async (userId: number) => ({
    accessToken: signAccessToken(userId),
    refreshToken: await issueRefreshToken(userId, crypto.randomUUID()),
});

const revokeFamily = (familyId: string) =>
    refreshTokens()
        .createQueryBuilder()
        .update()
        .set({ revoked_at: () => "now()" })
        .where("family_id = :familyId AND revoked_at IS NULL", { familyId })
        .execute();

// Exchanges a valid refresh token for a new access + refresh pair. Presenting an already-rotated
// token is treated as theft and revokes the whole family.
export const rotateRefreshToken = async (raw: string) => {
    const row = await refreshTokens()
        .createQueryBuilder("rt")
        .leftJoinAndSelect("rt.user", "user")
        .where("rt.token_hash = :h", { h: hash(raw) })
        .getOne();
    if (!row) throw unauthorized("Invalid refresh token");

    if (row.revoked_at) {
        await revokeFamily(row.family_id);
        throw unauthorized("Refresh token already used; please sign in again");
    }
    if (row.expires_at.getTime() < Date.now()) throw unauthorized("Refresh token expired");

    // Atomically claim the token so two concurrent refreshes cannot both succeed.
    const claimed = await refreshTokens()
        .createQueryBuilder()
        .update()
        .set({ revoked_at: () => "now()" })
        .where("id = :id AND revoked_at IS NULL", { id: row.id })
        .execute();
    if (!claimed.affected) {
        await revokeFamily(row.family_id);
        throw unauthorized("Refresh token already used; please sign in again");
    }

    const user = row.user;
    if (!user || user.deleted_at) throw unauthorized("Account no longer exists");
    if (user.suspended_at) throw forbidden("This account is suspended");

    return {
        user,
        accessToken: signAccessToken(user.id),
        refreshToken: await issueRefreshToken(user.id, row.family_id),
    };
};

// Logout: revokes the presented token's whole family (all rotations of that session). Idempotent.
export const revokeRefreshToken = async (raw: string) => {
    const row = await refreshTokens().findOneBy({ token_hash: hash(raw) });
    if (row) await revokeFamily(row.family_id);
};

export const revokeAllForUser = (userId: number) =>
    refreshTokens()
        .createQueryBuilder()
        .update()
        .set({ revoked_at: () => "now()" })
        .where("user_id = :userId AND revoked_at IS NULL", { userId })
        .execute();
