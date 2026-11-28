import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne } from "typeorm";
import { User } from "./User";

export enum ResourceAvailability {
    AVAILABLE = "AVAILABLE",
    RESERVED = "RESERVED",
    BORROWED = "BORROWED",
    UNAVAILABLE = "UNAVAILABLE"
}

export enum ResourceType {
    LOAN = "LOAN",
    DONATION = "DONATION"
}

export enum ResourceCategory {
    TOOLS = "tools",
    ELECTRONICS = "electronics",
    OUTDOORS = "outdoors",
    FURNITURE = "furniture",
    KITCHEN = "kitchen",
    BOOKS = "books",
    OTHER = "other"
}

// Fixed set of sharing radii, in metres.
export const SHARING_RADII_M = [500, 1000, 2000, 5000] as const;
export const MAX_RESOURCE_IMAGES = 5;

@Entity("resources")
export class Resource {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    owner: User;

    @Column()
    title: string;

    @Column("text")
    description: string;

    @Column({ type: "enum", enum: ResourceCategory, default: ResourceCategory.OTHER })
    category: ResourceCategory;

    @Column({ type: "enum", enum: ResourceType, default: ResourceType.LOAN })
    resource_type: ResourceType;

    @Column({
        type: "geometry",
        spatialFeatureType: "Point",
        srid: 4326,
    })
    @Index({ spatial: true })
    location: string;

    @Column("int", { default: 2000 })
    sharing_radius_m: number;

    @Column("int", { nullable: true })
    lending_duration_days: number;

    // Kept in sync with resource_type === DONATION (the request flow reads it).
    @Column("boolean", { default: false })
    is_donation: boolean;

    @Column("text", { array: true, default: () => "'{}'" })
    image_urls: string[];

    @Column({
        type: "enum",
        enum: ResourceAvailability,
        default: ResourceAvailability.AVAILABLE
    })
    availability: ResourceAvailability;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date | null;
}
