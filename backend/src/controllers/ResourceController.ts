import { Request, Response } from "express";
import * as resourceService from "../services/resourceService";

export const getNearbyResources = async (req: Request, res: Response) => {
    res.json(await resourceService.findNearby(req.valid!.query));
};

export const getResourceOptions = (_req: Request, res: Response) => {
    res.json(resourceService.resourceOptions());
};

export const getResource = async (req: Request, res: Response) => {
    res.json(await resourceService.getById(req.valid!.params.resourceId));
};

export const createResource = async (req: Request, res: Response) => {
    res.status(201).json(await resourceService.createResource(req.user!.id, req.valid!.body));
};

export const updateResource = async (req: Request, res: Response) => {
    res.json(await resourceService.updateResource(req.user!.id, req.valid!.params.resourceId, req.valid!.body));
};

export const deleteResource = async (req: Request, res: Response) => {
    res.json(await resourceService.deleteResource(req.user!.id, req.valid!.params.resourceId));
};

export const signImageUpload = async (req: Request, res: Response) => {
    res.json(await resourceService.signImageUpload(req.user!.id, req.valid!.params.resourceId));
};

export const addImage = async (req: Request, res: Response) => {
    res.status(201).json(await resourceService.addImage(req.user!.id, req.valid!.params.resourceId, req.valid!.body));
};

export const removeImage = async (req: Request, res: Response) => {
    res.json(await resourceService.removeImage(req.user!.id, req.valid!.params.resourceId, req.valid!.body.url));
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
