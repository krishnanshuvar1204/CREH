import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password_hash: string;

    @Column("decimal", { precision: 3, scale: 2, default: 5.0 })
    reputation_score: number;

    @Column({
        type: "geometry",
        spatialFeatureType: "Point",
        srid: 4326,
        nullable: true
    })
    location: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
