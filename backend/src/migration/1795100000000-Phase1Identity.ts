import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase1Identity1795100000000 implements MigrationInterface {
    name = "Phase1Identity1795100000000";

    public async up(q: QueryRunner): Promise<void> {
        await q.query(
            `CREATE TYPE "public"."users_verification_status_enum" AS ENUM('unverified', 'email_verified', 'community_pending', 'community_verified')`
        );
        await q.query(`ALTER TABLE "users"
            ADD "verification_status" "public"."users_verification_status_enum" NOT NULL DEFAULT 'unverified',
            ADD "email_verified_at" TIMESTAMP,
            ADD "phone" character varying(30),
            ADD "address" character varying(300),
            ADD "avatar_url" text,
            ADD "bio" character varying(500),
            ADD "community_verification_note" text,
            ADD "community_verification_submitted_at" TIMESTAMP,
            ADD "suspended_at" TIMESTAMP,
            ADD "deleted_at" TIMESTAMP`);
        // Accounts that existed before email verification was introduced are grandfathered in.
        await q.query(`UPDATE "users" SET "verification_status" = 'email_verified', "email_verified_at" = now()`);
        // The old register flow wrote a hard-coded placeholder home location; it is not real, so clear it.
        await q.query(
            `UPDATE "users" SET "location" = NULL WHERE ST_Equals("location", ST_SetSRID(ST_MakePoint(-122.4, 37.8), 4326))`
        );

        await q.query(`CREATE TABLE "email_verifications" (
            "id" SERIAL NOT NULL,
            "code_hash" character varying NOT NULL,
            "expires_at" TIMESTAMP NOT NULL,
            "attempts" integer NOT NULL DEFAULT 0,
            "consumed_at" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "user_id" integer,
            CONSTRAINT "PK_email_verifications" PRIMARY KEY ("id"),
            CONSTRAINT "FK_email_verifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
        await q.query(`CREATE INDEX "IDX_email_verifications_user" ON "email_verifications" ("user_id")`);

        await q.query(`CREATE TABLE "refresh_tokens" (
            "id" SERIAL NOT NULL,
            "token_hash" character varying NOT NULL,
            "family_id" uuid NOT NULL,
            "expires_at" TIMESTAMP NOT NULL,
            "revoked_at" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "user_id" integer,
            CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
            CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
        await q.query(`CREATE UNIQUE INDEX "IDX_refresh_tokens_hash" ON "refresh_tokens" ("token_hash")`);
        await q.query(`CREATE INDEX "IDX_refresh_tokens_user" ON "refresh_tokens" ("user_id")`);
        await q.query(`CREATE INDEX "IDX_refresh_tokens_family" ON "refresh_tokens" ("family_id")`);
    }

    public async down(q: QueryRunner): Promise<void> {
        await q.query(`DROP TABLE "refresh_tokens"`);
        await q.query(`DROP TABLE "email_verifications"`);
        await q.query(`ALTER TABLE "users"
            DROP COLUMN "deleted_at", DROP COLUMN "suspended_at",
            DROP COLUMN "community_verification_submitted_at", DROP COLUMN "community_verification_note",
            DROP COLUMN "bio", DROP COLUMN "avatar_url", DROP COLUMN "address", DROP COLUMN "phone",
            DROP COLUMN "email_verified_at", DROP COLUMN "verification_status"`);
        await q.query(`DROP TYPE "public"."users_verification_status_enum"`);
    }
}
