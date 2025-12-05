# 🗄️ Database Configuration

Este documento describe la configuración de base de datos, entidades TypeORM, y sistema de migraciones del proyecto multi-tenant ecommerce.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Database Module (libs/common)](#database-module-libscommon)
4. [Entities](#entities)
5. [Migrations](#migrations)
6. [Scripts](#scripts)
7. [Environment Variables](#environment-variables)

---

## Overview

El proyecto utiliza **PostgreSQL** como base de datos con **TypeORM** como ORM. Siguiendo el patrón de **database-per-service**, cada microservicio tiene su propia base de datos dentro del mismo motor PostgreSQL.

### Bases de Datos

| Base de Datos | Servicio        | Descripción                                            |
| ------------- | --------------- | ------------------------------------------------------ |
| `tenant_db`   | tenant-service  | Gestión de tenants, configuraciones, dominios, billing |
| `product_db`  | product-service | Catálogo de productos, categorías, variantes, imágenes |
| `order_db`    | order-service   | Órdenes, items, historial (futuro)                     |

---

## Database Architecture

```
PostgreSQL Engine (1 container: ecommerce-postgres)
│
├── tenant_db          ← Owned by Tenant Service
│   ├── tenants
│   ├── tenant_settings
│   ├── tenant_domains
│   └── tenant_billing
│
├── product_db         ← Owned by Product Service
│   ├── products
│   ├── categories
│   ├── product_variants
│   └── product_images
│
└── order_db           ← Owned by Order Service (future)
    ├── orders
    ├── order_items
    └── order_status_history
```

### Multi-Tenancy

Todas las tablas (excepto `tenants`) incluyen una columna `tenant_id` que referencia el ID de organización de Clerk. Esto permite el aislamiento de datos entre tenants.

```sql
-- Ejemplo: Query de productos siempre filtra por tenant_id
SELECT * FROM products WHERE tenant_id = 'org_nike_456';
```

---

## Database Module (libs/common)

La configuración de base de datos está centralizada en `libs/common` siguiendo el principio DRY.

### Estructura

```
libs/common/src/database/
├── database.module.ts      # Módulo dinámico para NestJS
├── data-source.factory.ts  # Factory para CLI de migraciones
├── base-tenant.entity.ts   # Entidad base con tenant_id
└── index.ts                # Exports
```

### DatabaseModule

Módulo dinámico que configura TypeORM para cada servicio:

```typescript
// Uso en un servicio
import { DatabaseModule } from '@app/common';
import { entities } from './database/entities';

@Module({
  imports: [
    DatabaseModule.forRoot({
      entities,
    }),
  ],
})
export class ProductServiceModule {}
```

El módulo lee las variables de entorno automáticamente:

- `DB_HOST` - Host de PostgreSQL
- `DB_PORT` - Puerto (default: 5432)
- `DB_USERNAME` - Usuario
- `DB_PASSWORD` - Contraseña
- `DB_NAME` - Nombre de la base de datos (específico por servicio)

### createDataSource Factory

Factory para crear DataSource usado por el CLI de TypeORM:

```typescript
// apps/product-service/src/typeorm.config.ts
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
```

### BaseTenantEntity

Entidad base que incluye campos comunes para entidades multi-tenant:

```typescript
import { BaseTenantEntity } from '@app/common';

@Entity('products')
export class Product extends BaseTenantEntity {
  // Hereda: id, tenantId, createdAt, updatedAt

  @Column()
  name: string;
}
```

---

## Entities

### Tenant Service Entities

| Entidad         | Tabla             | Descripción                                       |
| --------------- | ----------------- | ------------------------------------------------- |
| `Tenant`        | `tenants`         | Tenant principal (synced con Clerk Organizations) |
| `TenantSetting` | `tenant_settings` | Configuraciones key-value por tenant              |
| `TenantDomain`  | `tenant_domains`  | Dominios personalizados                           |
| `TenantBilling` | `tenant_billing`  | Información de facturación/suscripción            |

```
apps/tenant-service/src/database/entities/
├── tenant.entity.ts
├── tenant-setting.entity.ts
├── tenant-domain.entity.ts
├── tenant-billing.entity.ts
└── index.ts
```

#### Tenant Entity (Principal)

```typescript
@Entity('tenants')
export class Tenant {
  @PrimaryColumn()
  id: string; // Clerk Organization ID (org_xxx)

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string; // Para subdominio: nike.tuapp.com

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  // ... más campos
}
```

### Product Service Entities

| Entidad          | Tabla              | Descripción                         |
| ---------------- | ------------------ | ----------------------------------- |
| `Category`       | `categories`       | Categorías jerárquicas de productos |
| `Product`        | `products`         | Productos del catálogo              |
| `ProductVariant` | `product_variants` | Variantes (talla, color, etc.)      |
| `ProductImage`   | `product_images`   | Imágenes de productos               |

```
apps/product-service/src/database/entities/
├── category.entity.ts
├── product.entity.ts
├── product-variant.entity.ts
├── product-image.entity.ts
└── index.ts
```

#### Product Entity (Ejemplo con BaseTenantEntity)

```typescript
@Entity('products')
@Index(['tenantId', 'sku'], { unique: true, where: 'sku IS NOT NULL' })
export class Product extends BaseTenantEntity {
  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @ManyToOne(() => Category)
  category?: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];
}
```

---

## Migrations

Las migraciones se gestionan con TypeORM CLI. Cada servicio tiene sus propias migraciones.

### Estructura

```
apps/
├── tenant-service/src/database/migrations/
│   └── 1764910732634-InitialSchema.ts
└── product-service/src/database/migrations/
    └── 1764910784355-InitialSchema.ts
```

### Comandos

```bash
# Generar migración para tenant-service
pnpm migration:tenant:generate ./apps/tenant-service/src/database/migrations/NombreMigracion

# Generar migración para product-service
pnpm migration:product:generate ./apps/product-service/src/database/migrations/NombreMigracion

# Ejecutar migraciones de tenant-service
pnpm migration:tenant:run

# Ejecutar migraciones de product-service
pnpm migration:product:run

# Ejecutar TODAS las migraciones
pnpm migration:run:all

# Revertir última migración
pnpm migration:tenant:revert
pnpm migration:product:revert
```

### Cómo funcionan los scripts

Los scripts de migración:

1. Setean `DB_NAME` específico para cada servicio
2. Usan `ts-node` con `tsconfig-paths/register` para resolver `@app/common`
3. Ejecutan el CLI de TypeORM

```json
{
  "migration:tenant:run": "DB_NAME=tenant_db ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d ./apps/tenant-service/src/typeorm.config.ts"
}
```

---

## Scripts

### Inicialización de Bases de Datos

Antes de ejecutar migraciones, las bases de datos deben existir:

```bash
# Opción 1: Usar script SQL (dentro del contenedor)
docker exec -i ecommerce-postgres psql -U postgres < scripts/init-databases.sql

# Opción 2: Comandos individuales
docker exec ecommerce-postgres psql -U postgres -c "CREATE DATABASE tenant_db;"
docker exec ecommerce-postgres psql -U postgres -c "CREATE DATABASE product_db;"
docker exec ecommerce-postgres psql -U postgres -c "CREATE DATABASE order_db;"
```

### Script SQL (scripts/init-databases.sql)

```sql
-- Crear bases de datos
CREATE DATABASE tenant_db;
CREATE DATABASE product_db;
CREATE DATABASE order_db;

-- Habilitar extensión UUID en cada una
\c tenant_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c product_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c order_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Environment Variables

### Archivo .env

```bash
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
# DB_NAME is set per service (tenant_db, product_db, order_db)
```

### Docker Compose

Cada servicio tiene su `DB_NAME` específico:

```yaml
# tenant-service
environment:
  - DB_NAME=tenant_db

# product-service
environment:
  - DB_NAME=product_db
```

---

## Flujo Completo de Setup

```bash
# 1. Levantar PostgreSQL
pnpm docker:up

# 2. Crear bases de datos (en otra terminal)
docker exec -i ecommerce-postgres psql -U postgres < scripts/init-databases.sql

# 3. Ejecutar migraciones
pnpm migration:run:all

# 4. Verificar tablas creadas
docker exec ecommerce-postgres psql -U postgres -d tenant_db -c "\dt"
docker exec ecommerce-postgres psql -U postgres -d product_db -c "\dt"
```

---

## Troubleshooting

### Error: database "X" does not exist

Asegúrate de crear las bases de datos antes de ejecutar migraciones:

```bash
docker exec -i ecommerce-postgres psql -U postgres < scripts/init-databases.sql
```

### Error: Cannot find module '@app/common'

Los scripts de migración deben usar `ts-node -r tsconfig-paths/register`. Verifica que los scripts en `package.json` incluyan esto.

### Error: relation "X" already exists

La migración ya fue ejecutada. Puedes verificar con:

```bash
docker exec ecommerce-postgres psql -U postgres -d tenant_db -c "SELECT * FROM migrations;"
```

---

## Referencias

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [TypeORM Migrations](https://typeorm.io/migrations)
