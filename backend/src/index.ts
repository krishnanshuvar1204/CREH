import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import resourceRoutes from "./routes/resource.routes";
import { register, login } from "./controllers/AuthController";
import { createRequest, acceptRequest, processPayment, returnResource, ownerReviewReturn, resolveDispute, getUserRequests, getDisputes } from "./controllers/RequestController";
import { addReview, getUserReviews } from "./controllers/ReviewController";

import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const PORT = process.env.PORT || 5000;

app.use("/api/resources", resourceRoutes);

// Auth
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);

// User Resources
import { getUserResources } from "./controllers/ResourceController";
app.get("/api/users/:userId/resources", getUserResources);

// Requests / Payments / Escrow
app.post("/api/requests", createRequest);
app.get("/api/users/:userId/requests", getUserRequests);
app.post("/api/requests/:requestId/accept", acceptRequest);
app.post("/api/requests/:requestId/pay", processPayment);
app.post("/api/requests/:requestId/return", returnResource);
app.post("/api/requests/:requestId/review-return", ownerReviewReturn);

// Admin Disputes
app.get("/api/disputes", getDisputes);
app.post("/api/disputes/:disputeId/resolve", resolveDispute);

// Reviews
app.post("/api/reviews", addReview);
app.get("/api/users/:userId/reviews", getUserReviews);

// Chat
import { getMessages, sendMessage } from "./controllers/ChatController";
app.get("/api/requests/:requestId/messages", getMessages);
app.post("/api/requests/:requestId/messages", sendMessage);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err);
    });
