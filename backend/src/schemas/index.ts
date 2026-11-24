import { z } from "zod";

const id = z.coerce.number().int().positive();
const imageData = z.string().max(12 * 1024 * 1024);

// Password policy (P1-07): at least 8 characters with a letter and a digit. Login does not re-check it,
// so older accounts and seeded demo accounts can still sign in.
export const passwordPolicy = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number");

export const idParam = (name: string) => z.object({ [name]: id });

// ---- Auth ----
export const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().toLowerCase().max(254).pipe(z.email("Invalid email")),
    password: passwordPolicy,
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email("Invalid email")),
    password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(20).max(200) });
export const logoutSchema = z.object({ refreshToken: z.string().min(20).max(200).optional() });
export const verifyEmailSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });

// ---- Users / profile ----
const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .nullish()
        .transform((v) => (v === undefined ? undefined : v === "" || v === null ? null : v));

export const updateProfileSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100).optional(),
    phone: optionalText(30).refine((v) => v == null || /^\+?[0-9 ()-]{7,20}$/.test(v), "Enter a valid phone number"),
    address: optionalText(300),
    bio: optionalText(500),
    avatarBase64: imageData.nullish(),
    removeAvatar: z.boolean().optional(),
});

const coord = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
export const setLocationSchema = z.union([
    coord,
    z.object({ query: z.string().trim().min(3, "Enter at least 3 characters").max(200) }),
]);

export const communityVerificationSchema = z.object({
    note: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(1000),
});

// ---- Resources ----
export const nearbyQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radiusKm: z.coerce.number().min(0.1).max(100).default(5),
    category: z.string().trim().min(1).max(60).optional(),
});

export const createResourceSchema = z.object({
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().min(1).max(2000),
    category: z.string().trim().min(1).max(60),
    sharing_radius_km: z.coerce.number().min(0.1).max(100).default(5),
    lending_duration_days: z.coerce.number().int().min(0).max(365).nullish().transform((v) => v ?? undefined),
    is_donation: z.boolean().default(false),
    location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
    imageBase64: imageData.nullish(),
});

export const seedNearMeSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

// ---- Requests ----
export const createRequestSchema = z.object({
    resourceId: id,
    security_deposit_amount: z.coerce.number().min(0).max(100000).optional(),
});

export const ownerReviewSchema = z.object({
    isOk: z.boolean(),
    reason: z.string().trim().max(1000).optional(),
});

export const resolveDisputeSchema = z.object({
    refundRequester: z.boolean(),
    adminNotes: z.string().trim().max(2000).optional(),
});

// ---- Reviews ----
export const createReviewSchema = z.object({
    revieweeId: id,
    requestId: id,
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(1000),
});

// ---- Chat ----
export const sendMessageSchema = z
    .object({
        text: z.string().max(2000).nullish(),
        imageBase64: imageData.nullish(),
    })
    .refine((v) => (v.text && v.text.trim()) || v.imageBase64, { message: "Message must have text or an image" });
