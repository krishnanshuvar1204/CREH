import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entity/User";
import { forbidden, unauthorized } from "../lib/errors";
import { verifyAccessToken } from "../services/tokenService";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) throw unauthorized();

        const payload = verifyAccessToken(header.slice(7));
        const user = await AppDataSource.getRepository(User).findOneBy({ id: payload.userId });
        if (!user) throw unauthorized("Account no longer exists");

        req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
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
