import { Request, Response } from "express";
import * as resourceService from "../services/resourceService";

export const getNearbyResources = async (req: Request, res: Response) => {
    res.json(await resourceService.findNearby(req.valid!.query));
};

export const createResource = async (req: Request, res: Response) => {
    res.status(201).json(await resourceService.createResource(req.user!.id, req.valid!.body));
};

export const getMyResources = async (req: Request, res: Response) => {
    res.json(await resourceService.listByOwner(req.user!.id));
};

// Dev-only (mounted only when ENABLE_DEV_ROUTES=true).
export const seedNearMe = async (req: Request, res: Response) => {
    const { lat, lng } = req.valid!.body;
    const count = await resourceService.seedNearMe(req.user!.id, lat, lng);
    res.json({ message: "Seeded items near you", count });
};
