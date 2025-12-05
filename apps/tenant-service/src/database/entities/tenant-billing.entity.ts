import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum BillingPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum BillingStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  TRIALING = 'trialing',
}

/**
 * Billing and subscription information for each tenant.
 * Integrates with payment providers (e.g., Stripe).
 */
@Entity('tenant_billing')
export class TenantBilling {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', unique: true })
  @Index()
  tenantId: string;

  @Column({
    type: 'enum',
    enum: BillingPlan,
    default: BillingPlan.FREE,
  })
  plan: BillingPlan;

  @Column({
    type: 'enum',
    enum: BillingStatus,
    default: BillingStatus.ACTIVE,
  })
  status: BillingStatus;

  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId?: string;

  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId?: string;

  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
  currentPeriodStart?: Date;

  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
  currentPeriodEnd?: Date;

  @Column({ name: 'trial_ends_at', type: 'timestamp', nullable: true })
  trialEndsAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Tenant, (tenant) => tenant.billing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
