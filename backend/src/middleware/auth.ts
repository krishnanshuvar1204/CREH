import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole, VerificationStatus } from "../entity/User";
import { forbidden, HttpError, unauthorized } from "../lib/errors";
import { verifyAccessToken } from "../services/tokenService";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) throw unauthorized();

        const payload = verifyAccessToken(header.slice(7));
        const user = await AppDataSource.getRepository(User).findOneBy({ id: payload.userId });
        if (!user || user.deleted_at) throw unauthorized("Account no longer exists");
        if (user.suspended_at) throw forbidden("This account is suspended");

        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            verification_status: user.verification_status,
        };
        next();
    } catch (err) {
        next(err);
    }
};

export const requireRole = (role: UserRole) => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== role) return next(forbidden());
    next();
};

export const requireAdmin = requireRole(UserRole.ADMIN);

// Blocks users who have not confirmed their email from creating listings / requests (FR-A-2).
export const requireVerified = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (req.user.verification_status === VerificationStatus.UNVERIFIED) {
        return next(new HttpError(403, "Verify your email address to do that", { code: "EMAIL_NOT_VERIFIED" }));
    }
    next();
};
