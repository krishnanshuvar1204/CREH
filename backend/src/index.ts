import "reflect-metadata";
import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { AppDataSource } from "./data-source";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(
    pinoHttp({
        logger,
        genReqId: (req, res) => {
            const id = (req.headers["x-request-id"] as string) || crypto.randomUUID();
            res.setHeader("x-request-id", id);
            return id;
        },
    })
);
app.use(cors({ origin: env.CORS_ORIGIN }));
// Images still travel as base64 until signed uploads land (Phase 2); each image is capped at 8 MB.
app.use(express.json({ limit: "12mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", async (_req, res) => {
    const dbUp = AppDataSource.isInitialized && (await AppDataSource.query("SELECT 1").then(() => true, () => false));
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "degraded", db: dbUp ? "up" : "down" });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

AppDataSource.initialize()
    .then(() => {
        logger.info("Data source initialized");
        app.listen(env.PORT, () => logger.info(`Server is running on port ${env.PORT}`));
    })
    .catch((err) => {
        logger.error({ err }, "Error during data source initialization");
        process.exit(1);
    });
