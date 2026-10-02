import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne } from "typeorm";
import { User } from "./User";

export enum ResourceStatus {
    AVAILABLE = "AVAILABLE",
    BORROWED = "BORROWED",
    UNAVAILABLE = "UNAVAILABLE"
}

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

    @Column()
    category: string;

    @Column({
        type: "geometry",
        spatialFeatureType: "Point",
        srid: 4326,
    })
    @Index({ spatial: true })
    location: string;

    @Column("decimal", { precision: 5, scale: 2, default: 5.0 })
    sharing_radius_km: number;

    @Column("int", { nullable: true })
    lending_duration_days: number;

    @Column("boolean", { default: false })
    is_donation: boolean;

    @Column("text", { nullable: true })
    image_url: string;

    @Column({
        type: "enum",
        enum: ResourceStatus,
        default: ResourceStatus.AVAILABLE
    })
    status: ResourceStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
