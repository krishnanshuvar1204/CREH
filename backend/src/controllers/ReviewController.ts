import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Review } from "../entity/Review";
import { User } from "../entity/User";
import { Request as RequestEntity } from "../entity/Request";
import { assertReviewParties } from "../services/requestService";

export const addReview = async (req: Request, res: Response) => {
    const { revieweeId, requestId, rating, comment } = req.valid!.body;
    const reviewerId = req.user!.id;
    await assertReviewParties(reviewerId, revieweeId, requestId);

    const reviewRepo = AppDataSource.getRepository(Review);
    const review = await reviewRepo.save(
        reviewRepo.create({
            reviewer: { id: reviewerId } as User,
            reviewee: { id: revieweeId } as User,
            request: { id: requestId } as RequestEntity,
            rating,
            comment,
        })
    );
    // Reputation recompute lands in Phase 6.
    res.status(201).json(review);
};

export const getUserReviews = async (req: Request, res: Response) => {
    const reviews = await AppDataSource.getRepository(Review).find({
        where: { reviewee: { id: req.valid!.params.userId } },
        relations: ["reviewer"],
        order: { created_at: "DESC" },
    });
    res.json(reviews);
};
