import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        const userRepo = AppDataSource.getRepository(User);
        
        const existing = await userRepo.findOneBy({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already in use" });
        }

        const password_hash = await bcrypt.hash(password, 10);
        
        // Default location to center for mock purposes
        const location = { type: "Point", coordinates: [-122.4, 37.8] };

        const user = userRepo.create({
            name,
            email,
            password_hash,
            location: location as any
        });

        await userRepo.save(user);

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

        return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        return res.status(500).json({ error: "Error creating user" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const userRepo = AppDataSource.getRepository(User);
        
        const user = await userRepo.findOneBy({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

        return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        return res.status(500).json({ error: "Error logging in" });
    }
};
