import { Router } from "express";
import { getNearbyResources, createResource, seedNearMe } from "../controllers/ResourceController";

const router = Router();

router.get("/nearby", getNearbyResources);
router.post("/", createResource);
router.post("/seed", seedNearMe);

export default router;
