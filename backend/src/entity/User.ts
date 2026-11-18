import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum UserRole {
    MEMBER = "member",
    ADMIN = "admin"
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    password_hash: string;

    @Column({ type: "enum", enum: UserRole, default: UserRole.MEMBER })
    role: UserRole;

    @Column("decimal", { precision: 3, scale: 2, default: 5.0 })
    reputation_score: number;

    @Column({
        type: "geometry",
        spatialFeatureType: "Point",
        srid: 4326,
        nullable: true,
        select: false
    })
    location: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
