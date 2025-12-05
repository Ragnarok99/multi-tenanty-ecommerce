import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseTenantEntity } from '@app/common';
import { Product } from './product.entity';

/**
 * Product images with support for multiple images per product.
 * Images are sorted by sortOrder, with the first being the primary.
 */
@Entity('product_images')
export class ProductImage extends BaseTenantEntity {
  @Column({ name: 'product_id' })
  @Index()
  productId: string;

  @Column()
  url: string;

  @Column({ name: 'alt_text', nullable: true })
  altText?: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  // Image dimensions (optional, for optimization)
  @Column({ nullable: true })
  width?: number;

  @Column({ nullable: true })
  height?: number;

  // File size in bytes (optional)
  @Column({ name: 'file_size', nullable: true })
  fileSize?: number;

  // Relations
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
