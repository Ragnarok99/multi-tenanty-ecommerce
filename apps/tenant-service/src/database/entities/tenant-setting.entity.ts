import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Tenant } from './tenant.entity';

/**
 * Key-value settings for each tenant.
 * Allows flexible configuration without schema changes.
 *
 * @example
 * { key: 'currency', value: 'USD' }
 * { key: 'timezone', value: 'America/New_York' }
 * { key: 'enable_reviews', value: 'true' }
 */
@Entity('tenant_settings')
@Unique(['tenant', 'key'])
export class TenantSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
