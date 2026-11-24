import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { User } from "./User";

// Opaque rotating refresh tokens. `family_id` links a chain of rotations so that reuse of an
// already-rotated token (a sign of theft) revokes the whole family.
@Entity("refresh_tokens")
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Index({ unique: true })
    @Column()
    token_hash: string;

    @Index()
    @Column({ type: "uuid" })
    family_id: string;

    @Column({ type: "timestamp" })
    expires_at: Date;

    @Column({ type: "timestamp", nullable: true })
    revoked_at: Date | null;

    @CreateDateColumn()
    created_at: Date;
}
