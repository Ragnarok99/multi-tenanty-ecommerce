// Entity classes
export { Tenant } from './tenant.entity';
export { TenantSetting } from './tenant-setting.entity';
export { TenantDomain } from './tenant-domain.entity';
export { TenantBilling } from './tenant-billing.entity';

// Enums (exported separately to avoid issues with Object.values())
export { TenantStatus } from './tenant.entity';
export { DomainStatus } from './tenant-domain.entity';
export { BillingPlan, BillingStatus } from './tenant-billing.entity';

// Array of entity classes for TypeORM
import { Tenant } from './tenant.entity';
import { TenantSetting } from './tenant-setting.entity';
import { TenantDomain } from './tenant-domain.entity';
import { TenantBilling } from './tenant-billing.entity';

export const entities = [Tenant, TenantSetting, TenantDomain, TenantBilling];
