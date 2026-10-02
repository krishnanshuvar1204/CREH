import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { Request } from "./Request";

@Entity("reviews")
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    reviewer: User;

    @ManyToOne(() => User)
    reviewee: User;

    @ManyToOne(() => Request)
    request: Request;

    @Column("int")
    rating: number; // 1 to 5

    @Column("text")
    comment: string;

    @CreateDateColumn()
    created_at: Date;
}
