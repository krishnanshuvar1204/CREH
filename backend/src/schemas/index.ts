import { z } from "zod";
import { ResourceCategory, ResourceType, SHARING_RADII_M } from "../entity/Resource";

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
const category = z.enum(ResourceCategory);
const radiusM = z.coerce
    .number()
    .refine((v) => (SHARING_RADII_M as readonly number[]).includes(v), "Radius must be 500, 1000, 2000 or 5000 metres");
const lngLat = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
const duration = z.coerce.number().int().min(1).max(365);

export const nearbyQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radiusKm: z.coerce.number().min(0.1).max(100).default(5),
    category: category.optional(),
});

export const createResourceSchema = z.object({
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().min(1).max(2000),
    category,
    resource_type: z.enum(ResourceType).default(ResourceType.LOAN),
    sharing_radius_m: radiusM.default(2000),
    lending_duration_days: duration.nullish().transform((v) => v ?? undefined),
    location: lngLat,
});

// Owner edit. `availability` only toggles pause/resume; RESERVED/BORROWED are driven by the request flow.
export const updateResourceSchema = z
    .object({
        title: z.string().trim().min(1).max(150),
        description: z.string().trim().min(1).max(2000),
        category,
        resource_type: z.enum(ResourceType),
        sharing_radius_m: radiusM,
        lending_duration_days: duration.nullable(),
        location: lngLat,
        availability: z.enum(["AVAILABLE", "UNAVAILABLE"]),
    })
    .partial()
    .refine((v) => Object.keys(v).length > 0, "Nothing to update");

// Attach an image: either base64 (local storage) or a URL returned by a signed direct upload.
export const addResourceImageSchema = z
    .object({ imageBase64: imageData.optional(), url: z.url().max(500).optional() })
    .refine((v) => !!v.imageBase64 !== !!v.url, "Provide either imageBase64 or url");

export const removeResourceImageSchema = z.object({ url: z.string().min(1).max(500) });

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
