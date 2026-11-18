import { Router } from "express";
import { env } from "../config/env";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as schemas from "../schemas";
import { login, register } from "../controllers/AuthController";
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
router.post("/auth/register", validate(schemas.registerSchema), register);
router.post("/auth/login", validate(schemas.loginSchema), login);

// ---- Resources ----
router.get("/resources/nearby", validate(schemas.nearbyQuerySchema, "query"), getNearbyResources);
router.post("/resources", requireAuth, validate(schemas.createResourceSchema), createResource);
if (env.ENABLE_DEV_ROUTES) {
    router.post("/resources/seed", requireAuth, validate(schemas.seedNearMeSchema), seedNearMe);
}

// ---- Current user's data ----
router.get("/users/me/resources", requireAuth, getMyResources);
router.get("/users/me/requests", requireAuth, getMyRequests);

// ---- Requests / escrow lifecycle ----
router.post("/requests", requireAuth, validate(schemas.createRequestSchema), createRequest);
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
