import crypto from "crypto";
import { emailProvider } from "../adapters/email";
import { env } from "../config/env";
import { AppDataSource } from "../data-source";
import { EmailVerification } from "../entity/EmailVerification";
import { User, VerificationStatus } from "../entity/User";
import { badRequest, conflict, tooManyRequests } from "../lib/errors";
import { logger } from "../lib/logger";

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

const verifications = () => AppDataSource.getRepository(EmailVerification);
const users = () => AppDataSource.getRepository(User);

const hashCode = (userId: number, code: string) =>
    crypto.createHash("sha256").update(`${userId}:${code}:${env.JWT_SECRET}`).digest("hex");
const generateCode = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

// Creates a fresh code (invalidating older ones) and emails it. Email failure must not break
// registration, so it is logged; the user can use "resend".
export const sendVerificationCode = async (user: Pick<User, "id" | "email" | "name">) => {
    const code = generateCode();
    await verifications()
        .createQueryBuilder()
        .update()
        .set({ consumed_at: () => "now()" })
        .where("user_id = :id AND consumed_at IS NULL", { id: user.id })
        .execute();
    await verifications().insert({
        user: { id: user.id } as User,
        code_hash: hashCode(user.id, code),
        expires_at: new Date(Date.now() + env.VERIFICATION_CODE_TTL_MIN * 60 * 1000),
    });
    try {
        await emailProvider.send({
            to: user.email,
            subject: "Your CREH verification code",
            text: `Hi ${user.name},\n\nYour CREH verification code is ${code}.\nIt expires in ${env.VERIFICATION_CODE_TTL_MIN} minutes.\n\nIf you did not create an account, ignore this email.`,
        });
    } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to send verification email");
    }
};

export const resendVerificationCode = async (userId: number) => {
    const user = await users().findOneByOrFail({ id: userId });
    if (user.verification_status !== VerificationStatus.UNVERIFIED) throw conflict("Email is already verified");

    const latest = await verifications().findOne({
        where: { user: { id: userId } },
        order: { id: "DESC" },
    });
    // created_at is set by the DB clock (timezone-naive), so derive the send time from expires_at,
    // which this process writes and reads consistently.
    const sentAt = latest ? latest.expires_at.getTime() - env.VERIFICATION_CODE_TTL_MIN * 60 * 1000 : 0;
    if (latest && Date.now() - sentAt < RESEND_COOLDOWN_MS) {
        throw tooManyRequests("Please wait a minute before requesting another code");
    }
    await sendVerificationCode(user);
};

export const verifyEmail = async (userId: number, code: string) => {
    const user = await users().findOneByOrFail({ id: userId });
    if (user.verification_status !== VerificationStatus.UNVERIFIED) return user; // idempotent

    const active = await verifications()
        .createQueryBuilder("v")
        .where("v.user_id = :userId AND v.consumed_at IS NULL", { userId })
        .orderBy("v.id", "DESC")
        .getOne();

    if (!active || active.expires_at.getTime() < Date.now()) {
        throw badRequest("Code expired. Request a new one.");
    }
    if (active.attempts >= MAX_ATTEMPTS) {
        throw badRequest("Too many incorrect attempts. Request a new code.");
    }

    const expected = Buffer.from(active.code_hash);
    const given = Buffer.from(hashCode(userId, code));
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
        await verifications().increment({ id: active.id }, "attempts", 1);
        throw badRequest("Incorrect code");
    }

    await AppDataSource.transaction(async (m) => {
        await m.update(EmailVerification, { id: active.id }, { consumed_at: new Date() });
        await m.update(User, { id: userId }, { verification_status: VerificationStatus.EMAIL_VERIFIED, email_verified_at: new Date() });
    });
    return users().findOneByOrFail({ id: userId });
};
