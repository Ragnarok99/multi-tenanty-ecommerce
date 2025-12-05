import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1764910732634 implements MigrationInterface {
  name = 'InitialSchema1764910732634';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tenant_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying NOT NULL, "key" character varying NOT NULL, "value" text NOT NULL, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_12f2f980dcd16a276ce193c2a85" UNIQUE ("tenant_id", "key"), CONSTRAINT "PK_69225c0ca64bcbbf9af8a217043" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6abc1c3ed0df635955fc852f1" ON "tenant_settings" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_domains_status_enum" AS ENUM('pending', 'verified', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenant_domains" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying NOT NULL, "domain" character varying NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "status" "public"."tenant_domains_status_enum" NOT NULL DEFAULT 'pending', "verification_token" character varying, "verified_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_114ca3e45874f37ae9fef0ea6b5" UNIQUE ("domain"), CONSTRAINT "PK_5ade9ab3ed3d7eebef7a8ea5bdd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3fb0c5327fd96e396af091cb99" ON "tenant_domains" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_billing_plan_enum" AS ENUM('free', 'starter', 'professional', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_billing_status_enum" AS ENUM('active', 'past_due', 'cancelled', 'trialing')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenant_billing" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying NOT NULL, "plan" "public"."tenant_billing_plan_enum" NOT NULL DEFAULT 'free', "status" "public"."tenant_billing_status_enum" NOT NULL DEFAULT 'active', "stripe_customer_id" character varying, "stripe_subscription_id" character varying, "current_period_start" TIMESTAMP, "current_period_end" TIMESTAMP, "trial_ends_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e99e574e7fa6d942c9ceed9f80d" UNIQUE ("tenant_id"), CONSTRAINT "REL_e99e574e7fa6d942c9ceed9f80" UNIQUE ("tenant_id"), CONSTRAINT "PK_3adf5b4ad55795a97a1c8d122b2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e99e574e7fa6d942c9ceed9f80" ON "tenant_billing" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenants_status_enum" AS ENUM('active', 'suspended', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" character varying NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'active', "logo_url" character varying, "primary_color" character varying, "description" character varying, "email" character varying, "phone" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_settings" ADD CONSTRAINT "FK_a6abc1c3ed0df635955fc852f1c" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_domains" ADD CONSTRAINT "FK_3fb0c5327fd96e396af091cb99a" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_billing" ADD CONSTRAINT "FK_e99e574e7fa6d942c9ceed9f80d" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_billing" DROP CONSTRAINT "FK_e99e574e7fa6d942c9ceed9f80d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_domains" DROP CONSTRAINT "FK_3fb0c5327fd96e396af091cb99a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_settings" DROP CONSTRAINT "FK_a6abc1c3ed0df635955fc852f1c"`,
    );
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e99e574e7fa6d942c9ceed9f80"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_billing"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_billing_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_billing_plan_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3fb0c5327fd96e396af091cb99"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_domains"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_domains_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a6abc1c3ed0df635955fc852f1"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_settings"`);
  }
}
