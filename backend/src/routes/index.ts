import { Router } from "express";
import { env } from "../config/env";
import { requireAdmin, requireAuth, requireVerified } from "../middleware/auth";
import { loginLimiter, refreshLimiter, registerLimiter, verifyLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import * as schemas from "../schemas";
import { login, logout, refresh, register, resendVerification, verifyEmail } from "../controllers/AuthController";
import { getMe, setLocation, updateMe, verifyCommunity } from "../controllers/UserController";
import { createResource, getMyResources, getNearbyResources, seedNearMe } from "../controllers/ResourceController";
import {
    acceptRequest,
    createRequest,
    getDisputes,
    getMyRequests,
    ownerReviewReturn,
    processPayment,
    resolveDispute,
    returnResource,
} from "../controllers/RequestController";
import { addReview, getUserReviews } from "../controllers/ReviewController";
import { getMessages, sendMessage } from "../controllers/ChatController";

const router = Router();
const requestIdParams = validate(schemas.idParam("requestId"), "params");

// ---- Auth (public) ----
router.post("/auth/register", registerLimiter, validate(schemas.registerSchema), register);
router.post("/auth/login", loginLimiter, validate(schemas.loginSchema), login);
router.post("/auth/refresh", refreshLimiter, validate(schemas.refreshSchema), refresh);
router.post("/auth/logout", validate(schemas.logoutSchema), logout);

// ---- Email verification (signed in, not necessarily verified) ----
router.post("/auth/verify", requireAuth, verifyLimiter, validate(schemas.verifyEmailSchema), verifyEmail);
router.post("/auth/verify/resend", requireAuth, verifyLimiter, resendVerification);

// ---- Resources ----
router.get("/resources/nearby", validate(schemas.nearbyQuerySchema, "query"), getNearbyResources);
router.post("/resources", requireAuth, requireVerified, validate(schemas.createResourceSchema), createResource);
if (env.ENABLE_DEV_ROUTES) {
    router.post("/resources/seed", requireAuth, validate(schemas.seedNearMeSchema), seedNearMe);
}

// ---- Current user's data ----
router.get("/users/me", requireAuth, getMe);
router.patch("/users/me", requireAuth, validate(schemas.updateProfileSchema), updateMe);
router.put("/users/me/location", requireAuth, validate(schemas.setLocationSchema), setLocation);
router.post("/users/me/verify-community", requireAuth, validate(schemas.communityVerificationSchema), verifyCommunity);
router.get("/users/me/resources", requireAuth, getMyResources);
router.get("/users/me/requests", requireAuth, getMyRequests);

// ---- Requests / escrow lifecycle ----
router.post("/requests", requireAuth, requireVerified, validate(schemas.createRequestSchema), createRequest);
router.post("/requests/:requestId/accept", requireAuth, requestIdParams, acceptRequest);
router.post("/requests/:requestId/pay", requireAuth, requestIdParams, processPayment);
router.post("/requests/:requestId/return", requireAuth, requestIdParams, returnResource);
router.post(
    "/requests/:requestId/review-return",
    requireAuth,
    requestIdParams,
    validate(schemas.ownerReviewSchema),
    ownerReviewReturn
);

// ---- Chat (participants, or admin for disputed exchanges) ----
router.get("/requests/:requestId/messages", requireAuth, requestIdParams, getMessages);
router.post(
    "/requests/:requestId/messages",
    requireAuth,
    requestIdParams,
    validate(schemas.sendMessageSchema),
    sendMessage
);

// ---- Reviews ----
router.post("/reviews", requireAuth, validate(schemas.createReviewSchema), addReview);
router.get("/users/:userId/reviews", validate(schemas.idParam("userId"), "params"), getUserReviews);

// ---- Admin: disputes ----
router.get("/disputes", requireAuth, requireAdmin, getDisputes);
router.post(
    "/disputes/:disputeId/resolve",
    requireAuth,
    requireAdmin,
    validate(schemas.idParam("disputeId"), "params"),
    validate(schemas.resolveDisputeSchema),
    resolveDispute
);

export default router;
