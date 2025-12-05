import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { TenantSetting } from './tenant-setting.entity';
import { TenantDomain } from './tenant-domain.entity';
import { TenantBilling } from './tenant-billing.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

/**
 * Main tenant entity - synced with Clerk Organizations.
 * This is the master entity that represents a store/tenant.
 *
 * Note: This entity does NOT extend BaseTenantEntity because
 * it IS the tenant, not a tenant-scoped resource.
 */
@Entity('tenants')
export class Tenant {
  @PrimaryColumn()
  id: string; // Clerk Organization ID (org_xxx)

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string; // Used for subdomains: nike.tuapp.com

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ name: 'primary_color', nullable: true })
  primaryColor?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @OneToMany(() => TenantSetting, (setting) => setting.tenant, {
    cascade: true,
  })
  settings: TenantSetting[];

  @OneToMany(() => TenantDomain, (domain) => domain.tenant, { cascade: true })
  domains: TenantDomain[];

  @OneToOne(() => TenantBilling, (billing) => billing.tenant, { cascade: true })
  billing?: TenantBilling;
}
