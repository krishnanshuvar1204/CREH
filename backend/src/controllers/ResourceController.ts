import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Resource, ResourceStatus } from "../entity/Resource";

export const getNearbyResources = async (req: Request, res: Response) => {
    try {
        const { lat, lng, radiusKm, category } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lng as string);
        const searchRadiusMeters = (radiusKm ? parseFloat(radiusKm as string) : 5.0) * 1000;

        const originPoint = {
            type: "Point",
            coordinates: [longitude, latitude] // GeoJSON format: [lng, lat]
        };

        let query = AppDataSource.getRepository(Resource)
            .createQueryBuilder("resource")
            .where("resource.status = :status", { status: ResourceStatus.AVAILABLE });

        if (category) {
            query = query.andWhere("resource.category = :category", { category });
        }

        // PostGIS ST_DWithin for spatial radius search using Geography (meters)
        query = query.andWhere(
            "ST_DWithin(resource.location::geography, ST_SetSRID(ST_GeomFromGeoJSON(:origin), 4326)::geography, :searchRadiusMeters)",
            { origin: JSON.stringify(originPoint), searchRadiusMeters }
        );

        // Geofencing Check: Resource owner's radius must also cover the searcher's location
        query = query.andWhere(
            "ST_Distance(resource.location::geography, ST_SetSRID(ST_GeomFromGeoJSON(:origin), 4326)::geography) <= (resource.sharing_radius_km * 1000)"
        );

        // Sort by nearest first using ST_Distance
        query = query.orderBy(
            "ST_Distance(resource.location::geography, ST_SetSRID(ST_GeomFromGeoJSON(:origin), 4326)::geography)",
            "ASC"
        );

        const resources = await query.getMany();
        return res.json(resources);
    } catch (error) {
        console.error("Error fetching nearby resources:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

import fs from "fs";
import path from "path";
import crypto from "crypto";

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
        return null;
    }
};

export const createResource = async (req: Request, res: Response) => {
    try {
        const resourceRepo = AppDataSource.getRepository(Resource);
        const { ownerId, location, imageBase64, ...rest } = req.body;
        
        const owner = await AppDataSource.getRepository("User").findOneBy({ id: ownerId });
        if (!owner) return res.status(404).json({ error: "Owner not found" });

        let image_url = null;
        if (imageBase64) {
            image_url = saveBase64Image(imageBase64);
        }

        const newResource = resourceRepo.create({
            ...rest,
            owner,
            image_url,
            location: { type: "Point", coordinates: [location.lng, location.lat] } as any
        });
        
        await resourceRepo.save(newResource);
        return res.status(201).json(newResource);
    } catch (error) {
        return res.status(500).json({ error: "Could not create resource" });
    }
};

export const seedNearMe = async (req: Request, res: Response) => {
    try {
        const { lat, lng } = req.body;
        const resourceRepo = AppDataSource.getRepository(Resource);
        
        // Find admin user to own these
        const admin = await AppDataSource.getRepository("User").findOneBy({ email: "admin@creh.com" });
        if (!admin) return res.status(404).json({ error: "Admin not found, run seed first" });

        const resources = [
            {
                owner: admin,
                title: "Local Ladder",
                description: "Tall aluminum ladder. Great for cleaning gutters.",
                category: "Tools",
                location: { type: "Point", coordinates: [lng + 0.01, lat + 0.01] } as any,
                sharing_radius_km: 15,
                lending_duration_days: 2,
                is_donation: false
            },
            {
                owner: admin,
                title: "Wheelbarrow",
                description: "Sturdy wheelbarrow for gardening.",
                category: "Outdoors",
                location: { type: "Point", coordinates: [lng - 0.01, lat - 0.005] } as any,
                sharing_radius_km: 10,
                lending_duration_days: 1,
                is_donation: false
            }
        ];

        await resourceRepo.save(resources);
        return res.json({ message: "Seeded items near you", count: resources.length });
    } catch (error) {
        return res.status(500).json({ error: "Could not seed resources" });
    }
};

export const getUserResources = async (req: Request, res: Response) => {
    try {
        const resourceRepo = AppDataSource.getRepository(Resource);
        const resources = await resourceRepo.find({ where: { owner: { id: parseInt(req.params.userId as string) } } });
        return res.json(resources);
    } catch (error) {
        return res.status(500).json({ error: "Server error" });
    }
};
