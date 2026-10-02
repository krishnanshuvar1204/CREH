import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { Request } from "./Request";

@Entity("messages")
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Request, { onDelete: "CASCADE" })
    request: Request;

    @ManyToOne(() => User)
    sender: User;

    @Column("text", { nullable: true })
    text: string;

    @Column("text", { nullable: true })
    image_url: string;

    @CreateDateColumn()
    created_at: Date;
}
