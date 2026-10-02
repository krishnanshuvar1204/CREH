import { Request as ExpressRequest, Response } from "express";
import { AppDataSource } from "../data-source";
import { Request, RequestStatus } from "../entity/Request";
import { Resource, ResourceStatus } from "../entity/Resource";
import { User } from "../entity/User";
import { Dispute } from "../entity/Dispute";

// 1. Browse -> Request Product
export const createRequest = async (req: ExpressRequest, res: Response) => {
    try {
        const { resourceId, requesterId, security_deposit_amount } = req.body;
        const requestRepo = AppDataSource.getRepository(Request);
        const resourceRepo = AppDataSource.getRepository(Resource);
        
        const resource = await resourceRepo.findOne({ where: { id: resourceId }, relations: ["owner"] });
        if (!resource) return res.status(404).json({ error: "Resource not found" });

        if (resource.owner.id === requesterId) {
            return res.status(400).json({ error: "Cannot request your own resource" });
        }

        const newRequest = requestRepo.create({
            resource: { id: resourceId } as Resource,
            requester: { id: requesterId } as User,
            status: RequestStatus.PENDING,
            security_deposit_amount
        });

        await requestRepo.save(newRequest);
        return res.status(201).json(newRequest);
    } catch (error) {
        return res.status(500).json({ error: "Could not create request" });
    }
};

// 2. Owner Accepts Request
export const acceptRequest = async (req: ExpressRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const requestRepo = AppDataSource.getRepository(Request);
        const r = await requestRepo.findOneBy({ id: parseInt(requestId as string) });
        if (!r) return res.status(404).json({ error: "Request not found" });

        r.status = RequestStatus.ACCEPTED;
        await requestRepo.save(r);
        return res.json(r);
    } catch (error) {
        return res.status(500).json({ error: "Server error" });
    }
};

// 3. Requester deposits security money (Escrow Mock)
export const processPayment = async (req: ExpressRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const requestRepo = AppDataSource.getRepository(Request);
        
        const r = await requestRepo.findOne({ where: { id: parseInt(requestId as string) }, relations: ["resource"] });
        if (!r) return res.status(404).json({ error: "Request not found" });

        if (r.status !== RequestStatus.ACCEPTED) {
            return res.status(400).json({ error: "Request is not accepted yet" });
        }

        r.deposit_paid = true;
        r.status = RequestStatus.ACTIVE;
        await requestRepo.save(r);

        // Mark resource as borrowed
        const resourceRepo = AppDataSource.getRepository(Resource);
        const resource = await resourceRepo.findOneBy({ id: r.resource.id });
        if (resource) {
            resource.status = ResourceStatus.BORROWED;
            await resourceRepo.save(resource);
        }

        return res.json({ success: true, message: "Deposit paid. Item is now yours to use.", request: r });
    } catch (error) {
        return res.status(500).json({ error: "Payment failed" });
    }
};

// 4. Requester returns product
export const returnResource = async (req: ExpressRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const requestRepo = AppDataSource.getRepository(Request);
        const r = await requestRepo.findOneBy({ id: parseInt(requestId as string) });
        if (!r) return res.status(404).json({ error: "Not found" });

        r.status = RequestStatus.RETURNED_PENDING_REVIEW;
        await requestRepo.save(r);
        return res.json(r);
    } catch (error) {
        return res.status(500).json({ error: "Server error" });
    }
}

// 5. Owner reviews the return (OK or Damaged)
export const ownerReviewReturn = async (req: ExpressRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const { isOk, reason } = req.body;
        
        const requestRepo = AppDataSource.getRepository(Request);
        const r = await requestRepo.findOne({ where: { id: parseInt(requestId as string) }, relations: ["resource", "resource.owner"] });
        
        if (!r) return res.status(404).json({ error: "Not found" });

        if (isOk) {
            r.status = RequestStatus.COMPLETED;
            await requestRepo.save(r);

            // Resource available again
            const resourceRepo = AppDataSource.getRepository(Resource);
            const resource = await resourceRepo.findOneBy({ id: r.resource.id });
            if (resource) {
                resource.status = ResourceStatus.AVAILABLE;
                await resourceRepo.save(resource);
            }

            return res.json({ message: "Returned OK. Deposit refunded to requester.", request: r });
        } else {
            r.status = RequestStatus.DISPUTED;
            await requestRepo.save(r);

            const disputeRepo = AppDataSource.getRepository(Dispute);
            const dispute = disputeRepo.create({
                request: r,
                raised_by: r.resource.owner,
                reason: reason || "Item damaged or missing"
            });
            await disputeRepo.save(dispute);

            return res.json({ message: "Ticket raised. Admin will review.", request: r });
        }
    } catch (error) {
        return res.status(500).json({ error: "Server error" });
    }
}

// 6. Admin resolves dispute
export const resolveDispute = async (req: ExpressRequest, res: Response) => {
    try {
        const { disputeId } = req.params;
        const { refundRequester, adminNotes } = req.body; // true = refund requester, false = pay owner

        const disputeRepo = AppDataSource.getRepository(Dispute);
        const requestRepo = AppDataSource.getRepository(Request);
        const resourceRepo = AppDataSource.getRepository(Resource);

        const dispute = await disputeRepo.findOne({ where: { id: parseInt(disputeId as string) }, relations: ["request", "request.resource"] });
        if (!dispute) return res.status(404).json({ error: "Not found" });

        const r = dispute.request;

        if (refundRequester) {
            r.status = RequestStatus.RESOLVED_REFUNDED;
        } else {
            r.status = RequestStatus.RESOLVED_PAID_TO_OWNER;
        }
        
        await requestRepo.save(r);

        dispute.status = "RESOLVED";
        dispute.admin_notes = adminNotes;
        await disputeRepo.save(dispute);

        // Make resource available or unavailable based on admin judgement (assumed unavailable if paid to owner for damage)
        const resource = await resourceRepo.findOneBy({ id: r.resource.id });
        if (resource) {
            resource.status = refundRequester ? ResourceStatus.AVAILABLE : ResourceStatus.UNAVAILABLE;
            await resourceRepo.save(resource);
        }

        return res.json({ message: "Dispute resolved", dispute });
    } catch (error) {
        return res.status(500).json({ error: "Server error" });
    }
}

// Get all requests for a user
export const getUserRequests = async (req: ExpressRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const requestRepo = AppDataSource.getRepository(Request);
        
        const requests = await requestRepo.find({
            where: [
                { requester: { id: parseInt(userId as string) } },
                { resource: { owner: { id: parseInt(userId as string) } } }
            ],
            relations: ["resource", "resource.owner", "requester"]
        });
        
        return res.json(requests);
    } catch (error) {
        return res.status(500).json({ error: "Server error" });
    }
};

export const getDisputes = async (req: ExpressRequest, res: Response) => {
    try {
        const disputeRepo = AppDataSource.getRepository(Dispute);
        const disputes = await disputeRepo.find({
            relations: ["request", "request.resource", "request.requester", "raised_by"]
        });
        return res.json(disputes);
    } catch (error) {
        return res.status(500).json({ error: "Server error" });
    }
};