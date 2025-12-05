import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseTenantEntity } from '@app/common';
import { Product } from './product.entity';

/**
 * Product variants for different options (size, color, etc.).
 * Each variant can have its own price, SKU, and stock.
 *
 * @example
 * Product: "Nike Air Max"
 * Variants:
 *   - Size: 9, Color: Black, SKU: AM-BLK-9
 *   - Size: 10, Color: White, SKU: AM-WHT-10
 */
@Entity('product_variants')
@Index(['tenantId', 'sku'], { unique: true, where: 'sku IS NOT NULL' })
export class ProductVariant extends BaseTenantEntity {
  @Column({ name: 'product_id' })
  @Index()
  productId: string;

  @Column()
  name: string; // e.g., "Black / Size 9"

  @Column({ nullable: true })
  sku?: string;

  @Column({ nullable: true })
  barcode?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    name: 'compare_at_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  compareAtPrice?: number;

  @Column({ default: 0 })
  stock: number;

  // Variant options stored as JSON
  // e.g., { "size": "9", "color": "Black" }
  @Column({ type: 'jsonb', nullable: true })
  options?: Record<string, string>;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  // Relations
  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
