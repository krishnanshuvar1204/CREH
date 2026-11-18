import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Message } from "../entity/Message";
import { User } from "../entity/User";
import { assertChatAccess } from "../services/requestService";
import { localImageStorage } from "../services/imageStorage";

export const getMessages = async (req: Request, res: Response) => {
    const requestId = req.valid!.params.requestId;
    await assertChatAccess(req.user!, requestId);

    const messages = await AppDataSource.getRepository(Message).find({
        where: { request: { id: requestId } },
        relations: ["sender"],
        order: { created_at: "ASC" },
    });
    res.json(messages);
};

export const sendMessage = async (req: Request, res: Response) => {
    const requestId = req.valid!.params.requestId;
    const { text, imageBase64 } = req.valid!.body;
    const request = await assertChatAccess(req.user!, requestId);

    const image_url = imageBase64 ? await localImageStorage.saveBase64(imageBase64) : undefined;
    const msgRepo = AppDataSource.getRepository(Message);
    const msg = await msgRepo.save(
        msgRepo.create({ request, sender: { id: req.user!.id } as User, text: text ?? undefined, image_url })
    );

    res.json(await msgRepo.findOne({ where: { id: msg.id }, relations: ["sender"] }));
};
