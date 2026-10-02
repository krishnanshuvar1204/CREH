import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Review } from "../entity/Review";
import { User } from "../entity/User";
import { Request as RequestEntity } from "../entity/Request";

export const addReview = async (req: Request, res: Response) => {
    try {
        const { reviewerId, revieweeId, requestId, rating, comment } = req.body;
        
        const reviewRepo = AppDataSource.getRepository(Review);
        const userRepo = AppDataSource.getRepository(User);
        
        const review = reviewRepo.create({
            reviewer: { id: reviewerId } as User,
            reviewee: { id: revieweeId } as User,
            request: { id: requestId } as RequestEntity,
            rating,
            comment
        });

        await reviewRepo.save(review);
        
        // Update user reputation logic would go here
        
        return res.status(201).json(review);
    } catch (error) {
        return res.status(500).json({ error: "Could not add review" });
    }
};

export const getUserReviews = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const reviewRepo = AppDataSource.getRepository(Review);
        
        const reviews = await reviewRepo.find({
            where: { reviewee: { id: parseInt(userId as string) } },
            relations: ["reviewer"]
        });
        
        return res.json(reviews);
    } catch (error) {
        return res.status(500).json({ error: "Could not fetch reviews" });
    }
};
