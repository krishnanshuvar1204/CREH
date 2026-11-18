import { MigrationInterface, QueryRunner } from "typeorm";

export class Baseline1795010595355 implements MigrationInterface {
    name = 'Baseline1795010595355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "reputation_score" numeric(3,2) NOT NULL DEFAULT '5', "location" geometry(Point,4326), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."resources_status_enum" AS ENUM('AVAILABLE', 'BORROWED', 'UNAVAILABLE')`);
        await queryRunner.query(`CREATE TABLE "resources" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "category" character varying NOT NULL, "location" geometry(Point,4326) NOT NULL, "sharing_radius_km" numeric(5,2) NOT NULL DEFAULT '5', "lending_duration_days" integer, "is_donation" boolean NOT NULL DEFAULT false, "image_url" text, "status" "public"."resources_status_enum" NOT NULL DEFAULT 'AVAILABLE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" integer, CONSTRAINT "PK_632484ab9dff41bba94f9b7c85e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6d9de077c3d0e3dafe3f31207a" ON "resources" USING GiST ("location") `);
        await queryRunner.query(`CREATE TYPE "public"."requests_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'ACTIVE', 'RETURNED_PENDING_REVIEW', 'COMPLETED', 'DISPUTED', 'RESOLVED_REFUNDED', 'RESOLVED_PAID_TO_OWNER')`);
        await queryRunner.query(`CREATE TABLE "requests" ("id" SERIAL NOT NULL, "status" "public"."requests_status_enum" NOT NULL DEFAULT 'PENDING', "security_deposit_amount" numeric(10,2), "deposit_paid" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "resourceId" integer, "requesterId" integer, CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" SERIAL NOT NULL, "text" text, "image_url" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "requestId" integer, "senderId" integer, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "rating" integer NOT NULL, "comment" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "reviewerId" integer, "revieweeId" integer, "requestId" integer, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "disputes" ("id" SERIAL NOT NULL, "reason" text NOT NULL, "status" character varying NOT NULL DEFAULT 'OPEN', "admin_notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "requestId" integer, "raisedById" integer, CONSTRAINT "PK_3c97580d01c1a4b0b345c42a107" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "resources" ADD CONSTRAINT "FK_de3f7c16aa25ca0531df9b60e9c" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_8509b73b6c84dc1f1be2785901f" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_5ebb212dcbcf18fa826ab9f75d3" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_1a9a8327f718c21f827d6b12f42" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_f9238c3e3739dc40322f577fc46" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_c8f626e1e943aabb0f90fb8ee61" FOREIGN KEY ("revieweeId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_5159b6693f161a26dbe3585dc4f" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "disputes" ADD CONSTRAINT "FK_00bc1676c210548753bb297641f" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "disputes" ADD CONSTRAINT "FK_8880a40e54bc9b4675323ca102e" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "disputes" DROP CONSTRAINT "FK_8880a40e54bc9b4675323ca102e"`);
        await queryRunner.query(`ALTER TABLE "disputes" DROP CONSTRAINT "FK_00bc1676c210548753bb297641f"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_5159b6693f161a26dbe3585dc4f"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_c8f626e1e943aabb0f90fb8ee61"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_f9238c3e3739dc40322f577fc46"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_1a9a8327f718c21f827d6b12f42"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_5ebb212dcbcf18fa826ab9f75d3"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_8509b73b6c84dc1f1be2785901f"`);
        await queryRunner.query(`ALTER TABLE "resources" DROP CONSTRAINT "FK_de3f7c16aa25ca0531df9b60e9c"`);
        await queryRunner.query(`DROP TABLE "disputes"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "requests"`);
        await queryRunner.query(`DROP TYPE "public"."requests_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d9de077c3d0e3dafe3f31207a"`);
        await queryRunner.query(`DROP TABLE "resources"`);
        await queryRunner.query(`DROP TYPE "public"."resources_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
