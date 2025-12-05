import { createDataSource } from '@app/common';
import {
  Tenant,
  TenantSetting,
  TenantDomain,
  TenantBilling,
} from './database/entities';

export default createDataSource({
  database: process.env.DB_NAME || 'tenant_db',
  entities: [Tenant, TenantSetting, TenantDomain, TenantBilling],
  migrationsPath: __dirname + '/database/migrations/*{.ts,.js}',
});
