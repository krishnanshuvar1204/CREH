import { MigrationInterface, QueryRunner } from "typeorm";

// Phase 2: resource_type, image_urls[], availability (+RESERVED), deleted_at, sharing_radius_m, category enum.
export class Phase2Resources1795200000000 implements MigrationInterface {
    name = "Phase2Resources1795200000000";

    public async up(q: QueryRunner): Promise<void> {
        // Category: free text -> 7-value enum. Known names map across; anything else becomes 'other'.
        await q.query(
            `CREATE TYPE "public"."resources_category_enum" AS ENUM('tools', 'electronics', 'outdoors', 'furniture', 'kitchen', 'books', 'other')`
        );
        await q.query(`ALTER TABLE "resources" ALTER COLUMN "category" TYPE "public"."resources_category_enum" USING (
            CASE
                WHEN lower(trim("category")) IN ('tools', 'tool') THEN 'tools'
                WHEN lower(trim("category")) IN ('electronics', 'electronic', 'photo', 'camera') THEN 'electronics'
                WHEN lower(trim("category")) IN ('outdoors', 'outdoor', 'camping', 'sports', 'bikes', 'garden') THEN 'outdoors'
                WHEN lower(trim("category")) IN ('furniture') THEN 'furniture'
                WHEN lower(trim("category")) IN ('kitchen', 'home') THEN 'kitchen'
                WHEN lower(trim("category")) IN ('books', 'book', 'media') THEN 'books'
                ELSE 'other'
            END)::"public"."resources_category_enum"`);
        await q.query(`ALTER TABLE "resources" ALTER COLUMN "category" SET DEFAULT 'other'`);

        // Type of listing.
        await q.query(`CREATE TYPE "public"."resources_resource_type_enum" AS ENUM('LOAN', 'DONATION')`);
        await q.query(
            `ALTER TABLE "resources" ADD "resource_type" "public"."resources_resource_type_enum" NOT NULL DEFAULT 'LOAN'`
        );
        await q.query(`UPDATE "resources" SET "resource_type" = 'DONATION' WHERE "is_donation" = true`);

        // Images: single image_url -> image_urls[].
        await q.query(`ALTER TABLE "resources" ADD "image_urls" text array NOT NULL DEFAULT '{}'`);
        await q.query(`UPDATE "resources" SET "image_urls" = ARRAY["image_url"] WHERE "image_url" IS NOT NULL`);
        await q.query(`ALTER TABLE "resources" DROP COLUMN "image_url"`);

        // Availability: status -> availability, plus RESERVED.
        await q.query(`ALTER TABLE "resources" RENAME COLUMN "status" TO "availability"`);
        await q.query(`ALTER TYPE "public"."resources_status_enum" RENAME TO "resources_availability_enum"`);
        await q.query(`ALTER TYPE "public"."resources_availability_enum" ADD VALUE IF NOT EXISTS 'RESERVED'`);

        // Soft delete.
        await q.query(`ALTER TABLE "resources" ADD "deleted_at" TIMESTAMP`);

        // Sharing radius: km decimal -> metres from the fixed set {500, 1000, 2000, 5000} (rounded up, capped at 5 km).
        await q.query(`ALTER TABLE "resources" ADD "sharing_radius_m" integer NOT NULL DEFAULT 2000`);
        await q.query(`UPDATE "resources" SET "sharing_radius_m" = CASE
            WHEN "sharing_radius_km" <= 0.5 THEN 500
            WHEN "sharing_radius_km" <= 1 THEN 1000
            WHEN "sharing_radius_km" <= 2 THEN 2000
            ELSE 5000 END`);
        await q.query(`ALTER TABLE "resources" DROP COLUMN "sharing_radius_km"`);
        await q.query(
            `ALTER TABLE "resources" ADD CONSTRAINT "CHK_resources_sharing_radius_m" CHECK ("sharing_radius_m" IN (500, 1000, 2000, 5000))`
        );
    }

    public async down(q: QueryRunner): Promise<void> {
        await q.query(`ALTER TABLE "resources" DROP CONSTRAINT "CHK_resources_sharing_radius_m"`);
        await q.query(`ALTER TABLE "resources" ADD "sharing_radius_km" numeric(5,2) NOT NULL DEFAULT '5'`);
        await q.query(`UPDATE "resources" SET "sharing_radius_km" = "sharing_radius_m" / 1000.0`);
        await q.query(`ALTER TABLE "resources" DROP COLUMN "sharing_radius_m"`);

        await q.query(`ALTER TABLE "resources" DROP COLUMN "deleted_at"`);

        // RESERVED cannot be removed from a Postgres enum; fold it back into AVAILABLE and rebuild the type.
        await q.query(`ALTER TABLE "resources" ALTER COLUMN "availability" DROP DEFAULT`);
        await q.query(`ALTER TABLE "resources" ALTER COLUMN "availability" TYPE text USING "availability"::text`);
        await q.query(`UPDATE "resources" SET "availability" = 'AVAILABLE' WHERE "availability" = 'RESERVED'`);
        await q.query(`DROP TYPE "public"."resources_availability_enum"`);
        await q.query(`CREATE TYPE "public"."resources_status_enum" AS ENUM('AVAILABLE', 'BORROWED', 'UNAVAILABLE')`);
        await q.query(
            `ALTER TABLE "resources" ALTER COLUMN "availability" TYPE "public"."resources_status_enum" USING "availability"::"public"."resources_status_enum"`
        );
        await q.query(`ALTER TABLE "resources" ALTER COLUMN "availability" SET DEFAULT 'AVAILABLE'`);
        await q.query(`ALTER TABLE "resources" RENAME COLUMN "availability" TO "status"`);

        await q.query(`ALTER TABLE "resources" ADD "image_url" text`);
        await q.query(`UPDATE "resources" SET "image_url" = "image_urls"[1]`);
        await q.query(`ALTER TABLE "resources" DROP COLUMN "image_urls"`);

        await q.query(`ALTER TABLE "resources" DROP COLUMN "resource_type"`);
        await q.query(`DROP TYPE "public"."resources_resource_type_enum"`);

        await q.query(`ALTER TABLE "resources" ALTER COLUMN "category" DROP DEFAULT`);
        await q.query(`ALTER TABLE "resources" ALTER COLUMN "category" TYPE character varying USING "category"::text`);
        await q.query(`DROP TYPE "public"."resources_category_enum"`);
    }
}
