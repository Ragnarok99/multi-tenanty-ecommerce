// Entity classes
export { Category } from './category.entity';
export { Product } from './product.entity';
export { ProductVariant } from './product-variant.entity';
export { ProductImage } from './product-image.entity';

// Enums (exported separately to avoid issues with Object.values())
export { ProductStatus } from './product.entity';

// Array of entity classes for TypeORM
import { Category } from './category.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';

export const entities = [Category, Product, ProductVariant, ProductImage];
