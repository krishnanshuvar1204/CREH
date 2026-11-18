import { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors";
import { logger } from "../lib/logger";

export const notFoundHandler = (_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" });
};

// Consistent error shape: { error: string, details?: unknown }
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    }
    if ((err as any)?.type === "entity.too.large") {
        return res.status(413).json({ error: "Request body too large" });
    }
    if (err instanceof SyntaxError && "body" in (err as object)) {
        return res.status(400).json({ error: "Invalid JSON body" });
    }
    logger.error({ err, reqId: req.id }, "Unhandled error");
    return res.status(500).json({ error: "Internal server error" });
};
