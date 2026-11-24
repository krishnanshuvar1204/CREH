import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { User } from "./User";

// One-time email verification codes. Only a hash of the code is stored.
@Entity("email_verifications")
export class EmailVerification {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    code_hash: string;

    @Column({ type: "timestamp" })
    expires_at: Date;

    @Column({ type: "int", default: 0 })
    attempts: number;

    @Column({ type: "timestamp", nullable: true })
    consumed_at: Date | null;

    @CreateDateColumn()
    created_at: Date;
}
