import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1764910784355 implements MigrationInterface {
    name = 'InitialSchema1764910784355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "product_id" uuid NOT NULL, "name" character varying NOT NULL, "sku" character varying, "barcode" character varying, "price" numeric(10,2) NOT NULL, "compare_at_price" numeric(10,2), "stock" integer NOT NULL DEFAULT '0', "options" jsonb, "image_url" character varying, "weight" numeric(10,2), "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_553196ea54b383f352401962af" ON "product_variants" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6343513e20e2deab45edfce131" ON "product_variants" ("product_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a9c707d7fb647d9b7c43d50b97" ON "product_variants" ("tenant_id", "sku") WHERE sku IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "product_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "product_id" uuid NOT NULL, "url" character varying NOT NULL, "alt_text" character varying, "is_primary" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "width" integer, "height" integer, "file_size" integer, CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_866b999f190dfdec5a077e1abc" ON "product_images" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4f166bb8c2bfcef2498d97b406" ON "product_images" ("product_id") `);
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('draft', 'active', 'archived')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "slug" character varying, "description" text, "price" numeric(10,2) NOT NULL, "compare_at_price" numeric(10,2), "cost_price" numeric(10,2), "sku" character varying, "barcode" character varying, "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft', "is_featured" boolean NOT NULL DEFAULT false, "track_inventory" boolean NOT NULL DEFAULT true, "stock" integer NOT NULL DEFAULT '0', "low_stock_threshold" integer NOT NULL DEFAULT '5', "meta_title" character varying, "meta_description" character varying, "weight" numeric(10,2), "weight_unit" character varying NOT NULL DEFAULT 'kg', "category_id" uuid, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9c365ebf78f0e8a6d9e4827ea7" ON "products" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_22ad5445514d484d9a67095b59" ON "products" ("tenant_id", "status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5d7df2a87d8f3509895ace0415" ON "products" ("tenant_id", "sku") WHERE sku IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" character varying, "image_url" character varying, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "parent_id" uuid, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5d4fe23b360b1b9e16a3f41727" ON "categories" ("tenant_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_63db05d5bb2f8dd831ed655021" ON "categories" ("tenant_id", "slug") `);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63db05d5bb2f8dd831ed655021"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d4fe23b360b1b9e16a3f41727"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d7df2a87d8f3509895ace0415"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22ad5445514d484d9a67095b59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c365ebf78f0e8a6d9e4827ea7"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f166bb8c2bfcef2498d97b406"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_866b999f190dfdec5a077e1abc"`);
        await queryRunner.query(`DROP TABLE "product_images"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a9c707d7fb647d9b7c43d50b97"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6343513e20e2deab45edfce131"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_553196ea54b383f352401962af"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
    }

}
