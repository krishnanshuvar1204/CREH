import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { conflict, unauthorized } from "../lib/errors";
import { signAccessToken } from "../services/tokenService";

const publicUser = (u: User) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.valid!.body;
    const userRepo = AppDataSource.getRepository(User);

    if (await userRepo.findOneBy({ email })) throw conflict("Email already in use");

    const user = await userRepo.save(
        userRepo.create({
            name,
            email,
            password_hash: await bcrypt.hash(password, 10),
            // Placeholder home location until the user sets one (Phase 1, P1-05).
            location: { type: "Point", coordinates: [-122.4, 37.8] } as any,
        })
    );

    res.status(201).json({ token: signAccessToken(user.id), user: publicUser(user) });
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.valid!.body;
    // password_hash is select:false, so request it explicitly here only.
    const user = await AppDataSource.getRepository(User)
        .createQueryBuilder("user")
        .addSelect("user.password_hash")
        .where("user.email = :email", { email })
        .getOne();

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw unauthorized("Invalid credentials");
    }
    res.json({ token: signAccessToken(user.id), user: publicUser(user) });
};
