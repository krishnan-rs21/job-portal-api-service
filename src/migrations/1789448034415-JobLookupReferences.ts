import { MigrationInterface, QueryRunner } from "typeorm";

export class JobLookupReferences1789448034415 implements MigrationInterface {
    name = 'JobLookupReferences1789448034415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" ADD "employmentTypeId" integer`);
        await queryRunner.query(`ALTER TABLE "job" ADD "experienceLevelId" integer`);
        await queryRunner.query(`INSERT INTO "employment_type" ("name") SELECT DISTINCT "type" FROM "job" ON CONFLICT ("name") DO NOTHING`);
        await queryRunner.query(`INSERT INTO "experience_level" ("name") SELECT DISTINCT "experience" FROM "job" ON CONFLICT ("name") DO NOTHING`);
        await queryRunner.query(`UPDATE "job" SET "employmentTypeId" = "employment_type"."id" FROM "employment_type" WHERE "employment_type"."name" = "job"."type"`);
        await queryRunner.query(`UPDATE "job" SET "experienceLevelId" = "experience_level"."id" FROM "experience_level" WHERE "experience_level"."name" = "job"."experience"`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "employmentTypeId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "experienceLevelId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "experience"`);
        await queryRunner.query(`CREATE INDEX "IDX_9d257ca72119112009c9629863" ON "job"  ("experienceLevelId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dbafb4e7cdcd3e9c99a034fd8f" ON "job"  ("employmentTypeId") `);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_dbafb4e7cdcd3e9c99a034fd8f7" FOREIGN KEY ("employmentTypeId") REFERENCES "employment_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_9d257ca72119112009c96298634" FOREIGN KEY ("experienceLevelId") REFERENCES "experience_level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_9d257ca72119112009c96298634"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_dbafb4e7cdcd3e9c99a034fd8f7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dbafb4e7cdcd3e9c99a034fd8f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d257ca72119112009c9629863"`);
        await queryRunner.query(`ALTER TABLE "job" ADD "type" character varying`);
        await queryRunner.query(`ALTER TABLE "job" ADD "experience" character varying`);
        await queryRunner.query(`UPDATE "job" SET "type" = "employment_type"."name" FROM "employment_type" WHERE "employment_type"."id" = "job"."employmentTypeId"`);
        await queryRunner.query(`UPDATE "job" SET "experience" = "experience_level"."name" FROM "experience_level" WHERE "experience_level"."id" = "job"."experienceLevelId"`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "experience" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "experienceLevelId"`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "employmentTypeId"`);
    }

}
