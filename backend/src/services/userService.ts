import { geocoder } from "../adapters/geocoder";
import { AppDataSource } from "../data-source";
import { User, VerificationStatus } from "../entity/User";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { localImageStorage } from "./imageStorage";

const users = () => AppDataSource.getRepository(User);

// Everything the signed-in user may see about themselves. Never includes the password hash.
export const toSessionUser = (u: User) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    verification_status: u.verification_status,
    avatar_url: u.avatar_url,
});

const homeLocation = async (userId: number): Promise<{ lat: number; lng: number } | null> => {
    const rows: { lat: number | null; lng: number | null }[] = await AppDataSource.query(
        `SELECT ST_Y(location) AS lat, ST_X(location) AS lng FROM users WHERE id = $1`,
        [userId]
    );
    const r = rows[0];
    return r && r.lat !== null && r.lng !== null ? { lat: r.lat, lng: r.lng } : null;
};

export const getMe = async (userId: number) => {
    const user = await users().findOneBy({ id: userId });
    if (!user) throw notFound("User not found");
    const { community_verification_note, ...rest } = user;
    return {
        ...rest,
        community_verification_note,
        home_location: await homeLocation(userId),
    };
};

export interface UpdateProfileInput {
    name?: string;
    phone?: string | null;
    address?: string | null;
    bio?: string | null;
    avatarBase64?: string | null;
    removeAvatar?: boolean;
}

export const updateMe = async (userId: number, input: UpdateProfileInput) => {
    const { avatarBase64, removeAvatar, ...fields } = input;
    const patch: Partial<User> = {};
    for (const [k, v] of Object.entries(fields)) if (v !== undefined) (patch as any)[k] = v;
    if (avatarBase64) patch.avatar_url = await localImageStorage.saveBase64(avatarBase64);
    else if (removeAvatar) patch.avatar_url = null;

    if (Object.keys(patch).length) await users().update({ id: userId }, patch);
    return getMe(userId);
};

// Sets the home location from either a map pin ({lat,lng}) or an address search ({query}).
export const setLocation = async (userId: number, input: { lat: number; lng: number } | { query: string }) => {
    let lat: number, lng: number, label: string | null;
    if ("query" in input) {
        const hit = await geocoder.forward(input.query);
        if (!hit) throw badRequest("We couldn't find that address. Try a more specific search or drop a pin.");
        ({ lat, lng } = hit);
        label = hit.label;
    } else {
        ({ lat, lng } = input);
        label = await geocoder.reverse(lat, lng);
    }

    await AppDataSource.query(
        `UPDATE users SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326), updated_at = now() WHERE id = $3`,
        [lng, lat, userId]
    );
    // Fill the profile address from the geocoder, but never overwrite one the user typed themselves.
    const user = await users().findOneByOrFail({ id: userId });
    if (label && !user.address) await users().update({ id: userId }, { address: label.slice(0, 300) });

    return getMe(userId);
};

export const submitCommunityVerification = async (userId: number, note: string) => {
    const user = await users().findOneByOrFail({ id: userId });
    if (user.verification_status === VerificationStatus.UNVERIFIED) {
        throw forbidden("Verify your email before requesting community verification");
    }
    if (user.verification_status === VerificationStatus.COMMUNITY_VERIFIED) throw conflict("You are already community verified");
    if (!(await homeLocation(userId))) throw badRequest("Set your home location before requesting community verification");

    await users().update(
        { id: userId },
        {
            verification_status: VerificationStatus.COMMUNITY_PENDING,
            community_verification_note: note,
            community_verification_submitted_at: new Date(),
        }
    );
    return getMe(userId);
};
