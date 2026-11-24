import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { conflict, forbidden, unauthorized } from "../lib/errors";
import { revokeRefreshToken, rotateRefreshToken, startSession } from "../services/tokenService";
import { resendVerificationCode, sendVerificationCode, verifyEmail as verifyEmailCode } from "../services/verificationService";
import { toSessionUser } from "../services/userService";

const session = async (user: User) => {
    const { accessToken, refreshToken } = await startSession(user.id);
    return { token: accessToken, refreshToken, user: toSessionUser(user) };
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.valid!.body;
    const userRepo = AppDataSource.getRepository(User);

    if (await userRepo.findOneBy({ email })) throw conflict("Email already in use");

    // Home location starts empty; the user sets it during onboarding (PUT /users/me/location).
    const user = await userRepo.save(userRepo.create({ name, email, password_hash: await bcrypt.hash(password, 10) }));
    await sendVerificationCode(user);

    res.status(201).json(await session(user));
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.valid!.body;
    // password_hash is select:false, so request it explicitly here only.
    const user = await AppDataSource.getRepository(User)
        .createQueryBuilder("user")
        .addSelect("user.password_hash")
        .where("user.email = :email", { email })
        .getOne();

    if (!user || user.deleted_at || !(await bcrypt.compare(password, user.password_hash))) {
        throw unauthorized("Invalid credentials");
    }
    if (user.suspended_at) throw forbidden("This account is suspended");
    res.json(await session(user));
};

export const refresh = async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await rotateRefreshToken(req.valid!.body.refreshToken);
    res.json({ token: accessToken, refreshToken, user: toSessionUser(user) });
};

export const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.valid!.body;
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.status(204).end();
};

export const verifyEmail = async (req: Request, res: Response) => {
    const user = await verifyEmailCode(req.user!.id, req.valid!.body.code);
    res.json({ user: toSessionUser(user) });
};

export const resendVerification = async (req: Request, res: Response) => {
    await resendVerificationCode(req.user!.id);
    res.json({ message: "Verification code sent" });
};
