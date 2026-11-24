import { Request, Response } from "express";
import * as userService from "../services/userService";

export const getMe = async (req: Request, res: Response) => {
    res.json(await userService.getMe(req.user!.id));
};

export const updateMe = async (req: Request, res: Response) => {
    res.json(await userService.updateMe(req.user!.id, req.valid!.body));
};

export const setLocation = async (req: Request, res: Response) => {
    res.json(await userService.setLocation(req.user!.id, req.valid!.body));
};

export const verifyCommunity = async (req: Request, res: Response) => {
    res.json(await userService.submitCommunityVerification(req.user!.id, req.valid!.body.note));
};
