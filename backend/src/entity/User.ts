import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum UserRole {
    MEMBER = "member",
    ADMIN = "admin"
}

export enum VerificationStatus {
    UNVERIFIED = "unverified",
    EMAIL_VERIFIED = "email_verified",
    // Submitted for community verification; an admin approves it (Phase 7).
    COMMUNITY_PENDING = "community_pending",
    COMMUNITY_VERIFIED = "community_verified",
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

    @Column({ type: "enum", enum: VerificationStatus, default: VerificationStatus.UNVERIFIED })
    verification_status: VerificationStatus;

    @Column({ type: "timestamp", nullable: true })
    email_verified_at: Date | null;

    @Column({ type: "varchar", length: 30, nullable: true })
    phone: string | null;

    @Column({ type: "varchar", length: 300, nullable: true })
    address: string | null;

    @Column({ type: "text", nullable: true })
    avatar_url: string | null;

    @Column({ type: "varchar", length: 500, nullable: true })
    bio: string | null;

    @Column({ type: "text", nullable: true })
    community_verification_note: string | null;

    @Column({ type: "timestamp", nullable: true })
    community_verification_submitted_at: Date | null;

    @Column("decimal", { precision: 3, scale: 2, default: 5.0 })
    reputation_score: number;

    @Column({
        type: "geometry",
        spatialFeatureType: "Point",
        srid: 4326,
        nullable: true,
        select: false
    })
    location: string | null;

    // Set by an admin (Phase 7) to block a user; suspended users are rejected at auth.
    @Column({ type: "timestamp", nullable: true })
    suspended_at: Date | null;

    @Column({ type: "timestamp", nullable: true })
    deleted_at: Date | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
