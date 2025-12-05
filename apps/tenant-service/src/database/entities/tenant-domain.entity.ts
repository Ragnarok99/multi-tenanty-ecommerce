import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum DomainStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

/**
 * Custom domains for each tenant.
 * Allows tenants to use their own domains instead of subdomains.
 *
 * @example
 * Tenant "Nike" could have:
 * - nike.tuapp.com (subdomain - automatic)
 * - shop.nike.com (custom domain - requires verification)
 */
@Entity('tenant_domains')
export class TenantDomain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ unique: true })
  domain: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({
    type: 'enum',
    enum: DomainStatus,
    default: DomainStatus.PENDING,
  })
  status: DomainStatus;

  @Column({ name: 'verification_token', nullable: true })
  verificationToken?: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.domains, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
