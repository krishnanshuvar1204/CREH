import { AppDataSource } from "../data-source";
import { Request, RequestStatus } from "../entity/Request";
import { Resource, ResourceAvailability } from "../entity/Resource";
import { Dispute } from "../entity/Dispute";
import { User, UserRole } from "../entity/User";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors";

const requests = () => AppDataSource.getRepository(Request);

const loadRequest = async (id: number): Promise<Request> => {
    const r = await requests().findOne({
        where: { id },
        relations: ["resource", "resource.owner", "requester"],
        withDeleted: true, // history keeps showing items their owner later removed
    });
    if (!r) throw notFound("Request not found");
    return r;
};

const assertStatus = (r: Request, expected: RequestStatus) => {
    if (r.status !== expected) {
        throw conflict(`Request is ${r.status}, expected ${expected}`);
    }
};

const isOwner = (r: Request, userId: number) => r.resource.owner.id === userId;
const isRequester = (r: Request, userId: number) => r.requester.id === userId;

export const createRequest = async (userId: number, resourceId: number, deposit?: number) => {
    const resource = await AppDataSource.getRepository(Resource).findOne({
        where: { id: resourceId },
        relations: ["owner"],
    });
    if (!resource) throw notFound("Resource not found");
    if (resource.owner.id === userId) throw badRequest("Cannot request your own resource");
    if (resource.availability !== ResourceAvailability.AVAILABLE) throw conflict("Resource is not available");

    const duplicate = await requests().findOne({
        where: { resource: { id: resourceId }, requester: { id: userId }, status: RequestStatus.PENDING },
    });
    if (duplicate) throw conflict("You already have a pending request for this resource");

    const created = requests().create({
        resource: { id: resourceId } as Resource,
        requester: { id: userId } as User,
        status: RequestStatus.PENDING,
        security_deposit_amount: deposit,
    });
    return requests().save(created);
};

// Owner accepts a pending request.
export const acceptRequest = async (userId: number, requestId: number) => {
    const r = await loadRequest(requestId);
    if (!isOwner(r, userId)) throw forbidden("Only the owner can accept this request");
    assertStatus(r, RequestStatus.PENDING);
    r.status = RequestStatus.ACCEPTED;
    return requests().save(r);
};

// Requester pays the (mock) deposit and takes possession.
export const payDeposit = async (userId: number, requestId: number) => {
    const r = await loadRequest(requestId);
    if (!isRequester(r, userId)) throw forbidden("Only the requester can pay the deposit");
    assertStatus(r, RequestStatus.ACCEPTED);

    return AppDataSource.transaction(async (em) => {
        r.deposit_paid = true;
        r.status = RequestStatus.ACTIVE;
        await em.save(r);
        await em.update(Resource, { id: r.resource.id }, { availability: ResourceAvailability.BORROWED });
        return r;
    });
};

// Requester hands the item back.
export const returnResource = async (userId: number, requestId: number) => {
    const r = await loadRequest(requestId);
    if (!isRequester(r, userId)) throw forbidden("Only the requester can return the item");
    assertStatus(r, RequestStatus.ACTIVE);
    r.status = RequestStatus.RETURNED_PENDING_REVIEW;
    return requests().save(r);
};

// Owner confirms the return is fine, or raises a dispute.
export const ownerReviewReturn = async (userId: number, requestId: number, isOk: boolean, reason?: string) => {
    const r = await loadRequest(requestId);
    if (!isOwner(r, userId)) throw forbidden("Only the owner can review the return");
    assertStatus(r, RequestStatus.RETURNED_PENDING_REVIEW);

    return AppDataSource.transaction(async (em) => {
        if (isOk) {
            r.status = RequestStatus.COMPLETED;
            await em.save(r);
            await em.update(Resource, { id: r.resource.id }, { availability: ResourceAvailability.AVAILABLE });
            return { message: "Returned OK. Deposit refunded to requester.", request: r };
        }
        r.status = RequestStatus.DISPUTED;
        await em.save(r);
        await em.save(
            em.create(Dispute, {
                request: r,
                raised_by: r.resource.owner,
                reason: reason || "Item damaged or missing",
            })
        );
        return { message: "Ticket raised. Admin will review.", request: r };
    });
};

export const resolveDispute = async (disputeId: number, refundRequester: boolean, adminNotes?: string) => {
    const dispute = await AppDataSource.getRepository(Dispute).findOne({
        where: { id: disputeId },
        relations: ["request", "request.resource"],
        withDeleted: true,
    });
    if (!dispute) throw notFound("Dispute not found");
    if (dispute.status !== "OPEN") throw conflict("Dispute is already resolved");

    return AppDataSource.transaction(async (em) => {
        const r = dispute.request;
        r.status = refundRequester ? RequestStatus.RESOLVED_REFUNDED : RequestStatus.RESOLVED_PAID_TO_OWNER;
        await em.save(r);

        dispute.status = "RESOLVED";
        dispute.admin_notes = adminNotes ?? "";
        await em.save(dispute);

        await em.update(
            Resource,
            { id: r.resource.id },
            { availability: refundRequester ? ResourceAvailability.AVAILABLE : ResourceAvailability.UNAVAILABLE }
        );
        return { message: "Dispute resolved", dispute };
    });
};

export const listForUser = (userId: number) =>
    requests().find({
        where: [{ requester: { id: userId } }, { resource: { owner: { id: userId } } }],
        relations: ["resource", "resource.owner", "requester"],
        withDeleted: true, // history keeps showing items their owner later removed
        order: { created_at: "DESC" },
    });

export const listDisputes = () =>
    AppDataSource.getRepository(Dispute).find({
        relations: ["request", "request.resource", "request.requester", "raised_by"],
        withDeleted: true,
        order: { created_at: "DESC" },
    });

// Chat access: the two parties; admins only once the exchange is in dispute or resolved by an admin.
export const assertChatAccess = async (user: { id: number; role: UserRole }, requestId: number): Promise<Request> => {
    const r = await loadRequest(requestId);
    if (isOwner(r, user.id) || isRequester(r, user.id)) return r;
    const adminVisible = [
        RequestStatus.DISPUTED,
        RequestStatus.RESOLVED_REFUNDED,
        RequestStatus.RESOLVED_PAID_TO_OWNER,
    ].includes(r.status);
    if (user.role === UserRole.ADMIN && adminVisible) return r;
    throw forbidden("You are not part of this exchange");
};

// Reviews: only the two parties of a request may review each other.
export const assertReviewParties = async (reviewerId: number, revieweeId: number, requestId: number) => {
    const r = await loadRequest(requestId);
    const parties = [r.requester.id, r.resource.owner.id];
    if (!parties.includes(reviewerId)) throw forbidden("You are not part of this exchange");
    if (reviewerId === revieweeId || !parties.includes(revieweeId)) {
        throw badRequest("Reviewee must be the other party of the exchange");
    }
    return r;
};
