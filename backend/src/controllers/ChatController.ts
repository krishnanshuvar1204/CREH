import { Request as ExpressRequest, Response } from "express";
import { AppDataSource } from "../data-source";
import { Message } from "../entity/Message";
import { Request } from "../entity/Request";
import { User } from "../entity/User";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Save Base64 Image Helper
const saveBase64Image = (base64String: string): string | null => {
    try {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches?.length !== 3) return null;
        
        const ext = matches[1].split("/")[1] || "png";
        const buffer = Buffer.from(matches[2], "base64");
        
        const filename = `${crypto.randomUUID()}.${ext}`;
        const filepath = path.join(__dirname, "../../uploads", filename);
        
        fs.writeFileSync(filepath, buffer);
        return `/uploads/${filename}`;
    } catch (e) {
        console.error("Image save error", e);
        return null;
    }
};

export const getMessages = async (req: ExpressRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const msgRepo = AppDataSource.getRepository(Message);
        
        const messages = await msgRepo.find({
            where: { request: { id: parseInt(requestId as string) } },
            relations: ["sender"],
            order: { created_at: "ASC" }
        });
        
        return res.json(messages);
    } catch (error) {
        return res.status(500).json({ error: "Server error fetching messages" });
    }
};

export const sendMessage = async (req: ExpressRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const { senderId, text, imageBase64 } = req.body;
        
        const msgRepo = AppDataSource.getRepository(Message);
        const reqRepo = AppDataSource.getRepository(Request);
        
        const r = await reqRepo.findOneBy({ id: parseInt(requestId as string) });
        if (!r) return res.status(404).json({ error: "Request not found" });

        let image_url = undefined;
        if (imageBase64) {
            image_url = saveBase64Image(imageBase64) || undefined;
        }

        const msg = msgRepo.create({
            request: r,
            sender: { id: senderId } as User,
            text,
            image_url
        });
        
        await msgRepo.save(msg);
        
        // Fetch saved msg with sender
        const savedMsg = await msgRepo.findOne({ where: { id: msg.id }, relations: ["sender"] });
        
        return res.json(savedMsg);
    } catch (error) {
        return res.status(500).json({ error: "Server error sending message" });
    }
};
