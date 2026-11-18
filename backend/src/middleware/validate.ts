import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { badRequest } from "../lib/errors";

type Source = "body" | "query" | "params";

// Parses req[source] with Zod and stores the typed result on req.valid[source].
export const validate =
    (schema: ZodType, source: Source = "body") =>
    (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            return next(
                badRequest(
                    "Validation failed",
                    result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
                )
            );
        }
        req.valid = { ...req.valid, [source]: result.data };
        next();
    };
