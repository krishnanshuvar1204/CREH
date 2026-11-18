import { Request, Response } from "express";
import * as requestService from "../services/requestService";

const requestId = (req: Request): number => req.valid!.params.requestId;

export const createRequest = async (req: Request, res: Response) => {
    const { resourceId, security_deposit_amount } = req.valid!.body;
    res.status(201).json(await requestService.createRequest(req.user!.id, resourceId, security_deposit_amount));
};

export const acceptRequest = async (req: Request, res: Response) => {
    res.json(await requestService.acceptRequest(req.user!.id, requestId(req)));
};

export const processPayment = async (req: Request, res: Response) => {
    const request = await requestService.payDeposit(req.user!.id, requestId(req));
    res.json({ success: true, message: "Deposit paid. Item is now yours to use.", request });
};

export const returnResource = async (req: Request, res: Response) => {
    res.json(await requestService.returnResource(req.user!.id, requestId(req)));
};

export const ownerReviewReturn = async (req: Request, res: Response) => {
    const { isOk, reason } = req.valid!.body;
    res.json(await requestService.ownerReviewReturn(req.user!.id, requestId(req), isOk, reason));
};

export const getMyRequests = async (req: Request, res: Response) => {
    res.json(await requestService.listForUser(req.user!.id));
};

// ---- Admin: disputes ----
export const getDisputes = async (_req: Request, res: Response) => {
    res.json(await requestService.listDisputes());
};

export const resolveDispute = async (req: Request, res: Response) => {
    const { refundRequester, adminNotes } = req.valid!.body;
    res.json(await requestService.resolveDispute(req.valid!.params.disputeId, refundRequester, adminNotes));
};
