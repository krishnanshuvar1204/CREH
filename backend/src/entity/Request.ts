import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";
import { Resource } from "./Resource";

export enum RequestStatus {
    PENDING = "PENDING", // Initial request
    ACCEPTED = "ACCEPTED", // Owner accepted, waiting for deposit
    REJECTED = "REJECTED", // Owner rejected
    ACTIVE = "ACTIVE", // Deposit paid, item is with requester
    RETURNED_PENDING_REVIEW = "RETURNED_PENDING_REVIEW", // Requester returned it, owner must review
    COMPLETED = "COMPLETED", // Owner confirmed return, deposit refunded
    DISPUTED = "DISPUTED", // Owner claims damage/missing
    RESOLVED_REFUNDED = "RESOLVED_REFUNDED", // Admin ruled for Requester (Deposit refunded)
    RESOLVED_PAID_TO_OWNER = "RESOLVED_PAID_TO_OWNER" // Admin ruled for Owner (Deposit paid to owner)
}

@Entity("requests")
export class Request {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Resource)
    resource: Resource;

    @ManyToOne(() => User)
    requester: User;

    @Column({
        type: "enum",
        enum: RequestStatus,
        default: RequestStatus.PENDING
    })
    status: RequestStatus;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    security_deposit_amount: number;

    @Column({ default: false })
    deposit_paid: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
