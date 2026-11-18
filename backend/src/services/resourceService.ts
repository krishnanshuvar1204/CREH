import { AppDataSource } from "../data-source";
import { Resource, ResourceStatus } from "../entity/Resource";
import { User } from "../entity/User";
import { notFound } from "../lib/errors";
import { localImageStorage } from "./imageStorage";

const resources = () => AppDataSource.getRepository(Resource);

export interface NearbyParams {
    lat: number;
    lng: number;
    radiusKm: number;
    category?: string;
}

export const findNearby = async ({ lat, lng, radiusKm, category }: NearbyParams) => {
    const origin = JSON.stringify({ type: "Point", coordinates: [lng, lat] }); // GeoJSON order: [lng, lat]
    const originGeog = "ST_SetSRID(ST_GeomFromGeoJSON(:origin), 4326)::geography";

    const query = resources()
        .createQueryBuilder("resource")
        .where("resource.status = :status", { status: ResourceStatus.AVAILABLE })
        // Radius search (metres) via PostGIS geography.
        .andWhere(`ST_DWithin(resource.location::geography, ${originGeog}, :searchRadiusMeters)`, {
            origin,
            searchRadiusMeters: radiusKm * 1000,
        })
        // The owner's own sharing radius must also cover the searcher.
        .andWhere(`ST_Distance(resource.location::geography, ${originGeog}) <= (resource.sharing_radius_km * 1000)`)
        .orderBy(`ST_Distance(resource.location::geography, ${originGeog})`, "ASC");

    if (category) query.andWhere("resource.category = :category", { category });
    return query.getMany();
};

export interface CreateResourceInput {
    title: string;
    description: string;
    category: string;
    sharing_radius_km: number;
    lending_duration_days?: number;
    is_donation: boolean;
    location: { lat: number; lng: number };
    imageBase64?: string | null;
}

export const createResource = async (ownerId: number, input: CreateResourceInput) => {
    const { location, imageBase64, ...rest } = input;
    const image_url = imageBase64 ? await localImageStorage.saveBase64(imageBase64) : undefined;

    const entity = resources().create({
        ...rest,
        owner: { id: ownerId } as User,
        image_url,
        location: { type: "Point", coordinates: [location.lng, location.lat] } as any,
    });
    return resources().save(entity);
};

export const listByOwner = (ownerId: number) =>
    resources().find({ where: { owner: { id: ownerId } }, order: { created_at: "DESC" } });

// Dev helper: drops two demo items near the given point, owned by the calling user.
export const seedNearMe = async (ownerId: number, lat: number, lng: number) => {
    const owner = await AppDataSource.getRepository(User).findOneBy({ id: ownerId });
    if (!owner) throw notFound("User not found");

    const items = [
        {
            owner,
            title: "Local Ladder",
            description: "Tall aluminum ladder. Great for cleaning gutters.",
            category: "Tools",
            location: { type: "Point", coordinates: [lng + 0.01, lat + 0.01] } as any,
            sharing_radius_km: 15,
            lending_duration_days: 2,
            is_donation: false,
        },
        {
            owner,
            title: "Wheelbarrow",
            description: "Sturdy wheelbarrow for gardening.",
            category: "Outdoors",
            location: { type: "Point", coordinates: [lng - 0.01, lat - 0.005] } as any,
            sharing_radius_km: 10,
            lending_duration_days: 1,
            is_donation: false,
        },
    ];
    await resources().save(items);
    return items.length;
};
