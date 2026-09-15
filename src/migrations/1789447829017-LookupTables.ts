import { MigrationInterface, QueryRunner } from "typeorm";

export class LookupTables1789447829017 implements MigrationInterface {
    name = 'LookupTables1789447829017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "employment_type" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6b8a82de3c3a08a306ac943021a" UNIQUE ("uuid"), CONSTRAINT "UQ_559e08336bc84286a25bee9dc51" UNIQUE ("name"), CONSTRAINT "PK_a81b6af2e7b593de4c956ef7e69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "experience_level" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_339e2b67ce36ebe0ba633cc73a4" UNIQUE ("uuid"), CONSTRAINT "UQ_1708679e6ca1e251f1109fa737c" UNIQUE ("name"), CONSTRAINT "PK_b77747e25c4d85f36e902fa53f3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "experience_level"`);
        await queryRunner.query(`DROP TABLE "employment_type"`);
    }

}
