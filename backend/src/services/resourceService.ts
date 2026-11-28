import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import {
    MAX_RESOURCE_IMAGES,
    Resource,
    ResourceAvailability,
    ResourceCategory,
    ResourceType,
    SHARING_RADII_M,
} from "../entity/Resource";
import { Request, RequestStatus } from "../entity/Request";
import { User } from "../entity/User";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { imageStorage } from "./imageStorage";

const resources = () => AppDataSource.getRepository(Resource);

// Public owner fields only (never email, hash, or home location).
const withPublicOwner = (qb: ReturnType<ReturnType<typeof resources>["createQueryBuilder"]>) =>
    qb.leftJoin("resource.owner", "owner").addSelect(["owner.id", "owner.name", "owner.reputation_score"]);

export interface NearbyParams {
    lat: number;
    lng: number;
    radiusKm: number;
    category?: ResourceCategory;
}

export const findNearby = async ({ lat, lng, radiusKm, category }: NearbyParams) => {
    const origin = JSON.stringify({ type: "Point", coordinates: [lng, lat] }); // GeoJSON order: [lng, lat]
    const originGeog = "ST_SetSRID(ST_GeomFromGeoJSON(:origin), 4326)::geography";

    // Soft-deleted rows are excluded automatically (DeleteDateColumn).
    const query = withPublicOwner(resources().createQueryBuilder("resource"))
        .where("resource.availability = :availability", { availability: ResourceAvailability.AVAILABLE })
        // Radius search (metres) via PostGIS geography.
        .andWhere(`ST_DWithin(resource.location::geography, ${originGeog}, :searchRadiusMeters)`, {
            origin,
            searchRadiusMeters: radiusKm * 1000,
        })
        // The owner's own sharing radius must also cover the searcher.
        .andWhere(`ST_Distance(resource.location::geography, ${originGeog}) <= resource.sharing_radius_m`)
        .orderBy(`ST_Distance(resource.location::geography, ${originGeog})`, "ASC");

    if (category) query.andWhere("resource.category = :category", { category });
    return query.getMany();
};

export interface CreateResourceInput {
    title: string;
    description: string;
    category: ResourceCategory;
    resource_type: ResourceType;
    sharing_radius_m: number;
    lending_duration_days?: number;
    location: { lat: number; lng: number };
}

const point = ({ lat, lng }: { lat: number; lng: number }) => ({ type: "Point", coordinates: [lng, lat] }) as any;

export const createResource = async (ownerId: number, input: CreateResourceInput) => {
    const { location, ...rest } = input;
    const entity = resources().create({
        ...rest,
        is_donation: rest.resource_type === ResourceType.DONATION,
        image_urls: [],
        owner: { id: ownerId } as User,
        location: point(location),
    });
    return resources().save(entity);
};

export const listByOwner = (ownerId: number) =>
    resources().find({ where: { owner: { id: ownerId } }, order: { created_at: "DESC" } });

export const getById = async (id: number) => {
    const resource = await withPublicOwner(resources().createQueryBuilder("resource"))
        .where("resource.id = :id", { id })
        .getOne();
    if (!resource) throw notFound("Resource not found");
    return resource;
};

// Loads a live resource and checks the caller owns it.
const loadOwned = async (userId: number, id: number): Promise<Resource> => {
    const resource = await resources().findOne({ where: { id }, relations: ["owner"] });
    if (!resource) throw notFound("Resource not found");
    if (resource.owner.id !== userId) throw forbidden("You can only change your own items");
    return resource;
};

export interface UpdateResourceInput extends Partial<Omit<CreateResourceInput, "location" | "lending_duration_days">> {
    location?: { lat: number; lng: number };
    lending_duration_days?: number | null;
    availability?: ResourceAvailability.AVAILABLE | ResourceAvailability.UNAVAILABLE;
}

export const updateResource = async (userId: number, id: number, input: UpdateResourceInput) => {
    const resource = await loadOwned(userId, id);
    const { location, availability, ...rest } = input;

    if (availability !== undefined && availability !== resource.availability) {
        // Pause / resume is only possible while no exchange is in flight.
        if (![ResourceAvailability.AVAILABLE, ResourceAvailability.UNAVAILABLE].includes(resource.availability)) {
            throw conflict(`This item is ${resource.availability.toLowerCase()} for an exchange and can't be paused or resumed`);
        }
        resource.availability = availability;
    }
    Object.assign(resource, rest);
    if (rest.resource_type) resource.is_donation = rest.resource_type === ResourceType.DONATION;
    if (location) resource.location = point(location);

    await resources().save(resource);
    return getById(id);
};

const OPEN_EXCHANGE: RequestStatus[] = [
    RequestStatus.ACCEPTED,
    RequestStatus.ACTIVE,
    RequestStatus.RETURNED_PENDING_REVIEW,
    RequestStatus.DISPUTED,
];

// Soft delete: the row stays so request/review history remains intact; it disappears from discovery and lists.
export const deleteResource = async (userId: number, id: number) => {
    const resource = await loadOwned(userId, id);
    const requests = AppDataSource.getRepository(Request);

    const open = await requests.count({ where: { resource: { id }, status: In(OPEN_EXCHANGE) } });
    if (open > 0) throw conflict("This item has an exchange in progress. Finish or resolve it before deleting.");

    await AppDataSource.transaction(async (em) => {
        await em.update(Request, { resource: { id }, status: RequestStatus.PENDING }, { status: RequestStatus.REJECTED });
        await em.softDelete(Resource, { id: resource.id });
    });
    return { message: "Item deleted" };
};

// ---- Images ----
export const signImageUpload = async (userId: number, id: number) => {
    const resource = await loadOwned(userId, id);
    if (resource.image_urls.length >= MAX_RESOURCE_IMAGES) {
        throw badRequest(`An item can have at most ${MAX_RESOURCE_IMAGES} photos`);
    }
    return imageStorage.signUpload(`creh/resources/${resource.id}`);
};

export const addImage = async (userId: number, id: number, input: { imageBase64?: string; url?: string }) => {
    const resource = await loadOwned(userId, id);
    if (resource.image_urls.length >= MAX_RESOURCE_IMAGES) {
        throw badRequest(`An item can have at most ${MAX_RESOURCE_IMAGES} photos`);
    }
    let url: string;
    if (input.imageBase64) {
        url = await imageStorage.saveBase64(input.imageBase64);
    } else {
        url = input.url!;
        if (!imageStorage.owns(url)) throw badRequest("That image URL does not belong to our image storage");
    }
    resource.image_urls = [...resource.image_urls, url];
    await resources().save(resource);
    return getById(id);
};

export const removeImage = async (userId: number, id: number, url: string) => {
    const resource = await loadOwned(userId, id);
    if (!resource.image_urls.includes(url)) throw notFound("Image not found on this item");
    resource.image_urls = resource.image_urls.filter((u) => u !== url);
    await resources().save(resource);
    await imageStorage.remove(url);
    return getById(id);
};

export const resourceOptions = () => ({
    categories: Object.values(ResourceCategory),
    resource_types: Object.values(ResourceType),
    sharing_radii_m: SHARING_RADII_M,
    max_images: MAX_RESOURCE_IMAGES,
});

// Dev helper: drops two demo items near the given point, owned by the calling user.
export const seedNearMe = async (ownerId: number, lat: number, lng: number) => {
    const owner = await AppDataSource.getRepository(User).findOneBy({ id: ownerId });
    if (!owner) throw notFound("User not found");

    const items = [
        {
            owner,
            title: "Local Ladder",
            description: "Tall aluminum ladder. Great for cleaning gutters.",
            category: ResourceCategory.TOOLS,
            location: point({ lat: lat + 0.01, lng: lng + 0.01 }),
            sharing_radius_m: 5000,
            lending_duration_days: 2,
            is_donation: false,
        },
        {
            owner,
            title: "Wheelbarrow",
            description: "Sturdy wheelbarrow for gardening.",
            category: ResourceCategory.OUTDOORS,
            location: point({ lat: lat - 0.005, lng: lng - 0.01 }),
            sharing_radius_m: 5000,
            lending_duration_days: 1,
            is_donation: false,
        },
    ];
    await resources().save(items);
    return items.length;
};
