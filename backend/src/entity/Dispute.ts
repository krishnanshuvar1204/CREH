import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Request } from "./Request";
import { User } from "./User";

@Entity("disputes")
export class Dispute {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Request)
    request: Request;

    @ManyToOne(() => User)
    raised_by: User;

    @Column("text")
    reason: string;

    @Column({ default: "OPEN" })
    status: string; // OPEN, RESOLVED

    @Column("text", { nullable: true })
    admin_notes: string;

    @CreateDateColumn()
    created_at: Date;
}
