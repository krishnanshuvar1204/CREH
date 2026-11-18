import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRole1795010701502 implements MigrationInterface {
    name = 'AddUserRole1795010701502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('member', 'admin')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'member'`);
        // Existing deployments identified the admin by email; carry that over to the role column.
        await queryRunner.query(`UPDATE "users" SET "role" = 'admin' WHERE "email" = 'admin@creh.com'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
