import {
  DataSource,
  DataSourceOptions,
  EntitySchema,
  MixedList,
} from 'typeorm';

// Load environment variables for CLI usage (required for TypeORM CLI)
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
require('dotenv').config();

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type EntityType = MixedList<Function | string | EntitySchema>;

export interface DataSourceFactoryOptions {
  database: string;
  entities: EntityType;
  migrationsPath?: string;
}

/**
 * Creates a TypeORM DataSource for CLI operations (migrations, etc.)
 * This factory centralizes the database connection configuration.
 *
 * @param options - Configuration options for the data source
 * @returns A configured TypeORM DataSource instance
 *
 * @example
 * // In apps/product-service/src/typeorm.config.ts
 * import { createDataSource } from '@app/common';
 * import * as entities from './database/entities';
 *
 * export default createDataSource({
 *   database: 'product_db',
 *   entities: Object.values(entities),
 * });
 */
export function createDataSource(
  options: DataSourceFactoryOptions,
): DataSource {
  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: options.database,
    entities: options.entities,
    migrations: options.migrationsPath
      ? [options.migrationsPath]
      : [`${process.cwd()}/apps/*/src/database/migrations/*{.ts,.js}`],
    synchronize: false, // Always false for CLI - use migrations
    logging: process.env.DB_LOGGING === 'true',
  };

  return new DataSource(dataSourceOptions);
}
