import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseTenantEntity } from '@app/common';
import { Product } from './product.entity';

/**
 * Product categories for organizing the catalog.
 * Supports hierarchical structure with parent-child relationships.
 *
 * @example
 * - Electronics (parent)
 *   - Smartphones (child)
 *   - Laptops (child)
 */
@Entity('categories')
@Index(['tenantId', 'slug'], { unique: true })
export class Category extends BaseTenantEntity {
  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  // Self-referencing relationship for hierarchy
  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  // Products in this category
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
