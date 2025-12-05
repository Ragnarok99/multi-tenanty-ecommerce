import { createDataSource } from '@app/common';
import {
  Category,
  Product,
  ProductVariant,
  ProductImage,
} from './database/entities';

export default createDataSource({
  database: process.env.DB_NAME || 'product_db',
  entities: [Category, Product, ProductVariant, ProductImage],
  migrationsPath: __dirname + '/database/migrations/*{.ts,.js}',
});
