import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Base entity for all tenant-scoped entities.
 * Provides common fields: id, tenantId, createdAt, updatedAt.
 *
 * All queries to entities extending this class MUST filter by tenantId
 * to ensure proper data isolation between tenants.
 *
 * @example
 * @Entity('products')
 * export class Product extends BaseTenantEntity {
 *   @Column()
 *   name: string;
 * }
 */
export abstract class BaseTenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
