# 🏗️ Multi-Tenant Ecommerce - Architecture Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
4. [Microservices](#microservices)
5. [Database Strategy](#database-strategy)
6. [Authentication Flow](#authentication-flow)
7. [Request Flow Example](#request-flow-example)
8. [Data Isolation](#data-isolation)
9. [Tech Stack](#tech-stack)
10. [Project Structure](#project-structure)
11. [Patterns & Practices](#patterns--practices)
12. [Running the Project](#running-the-project)
13. [Roadmap](#roadmap)

---

## Overview

This is a **multi-tenant ecommerce platform** built with a microservices architecture. Each tenant (store) operates independently while sharing the same infrastructure.

### Key Characteristics

| Aspect              | Decision                                        |
| ------------------- | ----------------------------------------------- |
| **Architecture**    | Microservices                                   |
| **Multi-tenancy**   | Shared database with `tenant_id` column         |
| **Database**        | Database per service (single PostgreSQL engine) |
| **Authentication**  | Clerk (external service)                        |
| **API Entry Point** | API Gateway                                     |
| **Communication**   | REST (sync), Events (async - future)            |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTS                                        │
│                                                                                  │
│    nike.tuapp.com        adidas.tuapp.com        puma.tuapp.com                 │
│         │                       │                       │                        │
│         └───────────────────────┴───────────────────────┘                        │
│                                 │                                                │
└─────────────────────────────────┼────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLERK (External)                                    │
│                                                                                  │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                     │
│    │    Auth      │    │Organizations │    │   Webhooks   │                     │
│    │   (Login)    │    │  (Tenants)   │    │   (Sync)     │                     │
│    └──────────────┘    └──────────────┘    └──────────────┘                     │
│                                                                                  │
│    JWT contains: userId, orgId (tenant_id), role                                │
└─────────────────────────────────┬────────────────────────────────────────────────┘
                                  │
                                  │ JWT Token
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (:3000)                                    │
│                                                                                  │
│    ┌────────────────────────────────────────────────────────────────────────┐   │
│    │                         Responsibilities                                │   │
│    │                                                                         │   │
│    │  1. Validate JWT (Clerk)                                               │   │
│    │  2. Extract tenant_id (orgId from JWT)                                 │   │
│    │  3. Rate Limiting (per tenant)                                         │   │
│    │  4. Route to microservices                                             │   │
│    │  5. Aggregate responses (if needed)                                    │   │
│    └────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│    Routes:                                                                       │
│    ├── /api/tenants/*     → Tenant Service                                      │
│    ├── /api/products/*    → Product Service                                     │
│    ├── /api/orders/*      → Order Service (future)                              │
│    └── /api/webhooks/*    → Webhook handlers                                    │
└────────────────────────────────┬─────────────────────────────────────────────────┘
                                 │
                                 │ Internal Network (Docker)
                                 │ Headers: X-Tenant-ID, X-User-ID
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ TENANT SERVICE  │    │PRODUCT SERVICE  │    │ ORDER SERVICE   │
│    (:3001)      │    │    (:3002)      │    │    (:3003)      │
│                 │    │                 │    │    (future)     │
│ • Sync Clerk    │    │ • CRUD Products │    │ • Create orders │
│   webhooks      │    │ • Categories    │    │ • Order items   │
│ • Tenant config │    │ • Variants      │    │ • Status track  │
│ • Plans/billing │    │ • Images        │    │ • History       │
│ • Domains       │    │ • Inventory*    │    │                 │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   tenant_db     │    │   product_db    │    │    order_db     │
│                 │    │                 │    │                 │
│ • tenants       │    │ • products      │    │ • orders        │
│ • tenant_       │    │   (tenant_id)   │    │   (tenant_id)   │
│   settings      │    │ • categories    │    │ • order_items   │
│ • tenant_       │    │   (tenant_id)   │    │   (tenant_id)   │
│   domains       │    │ • product_      │    │ • order_status  │
│ • tenant_       │    │   variants      │    │   _history      │
│   billing       │    │   (tenant_id)   │    │   (tenant_id)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         └──────────────────────┴──────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │      PostgreSQL       │
                    │    (single engine)    │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │   tenant_db     │  │
                    │  │   product_db    │  │
                    │  │   order_db      │  │
                    │  └─────────────────┘  │
                    └───────────────────────┘
```

---

## Multi-Tenancy Strategy

### Approach: Shared Database with `tenant_id`

We use **Clerk Organizations** as our tenant identifier. Each organization in Clerk represents a store/tenant in our system.

```
Clerk Organization ID  →  tenant_id in all tables
org_nike_456           →  All Nike store data
org_adidas_789         →  All Adidas store data
```

### Why This Approach?

| Approach                  | Our Choice | Reason                           |
| ------------------------- | ---------- | -------------------------------- |
| Database per tenant       | ❌         | Too expensive, hard to maintain  |
| Schema per tenant         | ❌         | Migration complexity             |
| **Shared DB + tenant_id** | ✅         | Cost-effective, scalable, simple |

### Tenant Identification

Tenants are identified by:

- **Subdomain**: `nike.tuapp.com` → tenant_id extracted
- **JWT claim**: `orgId` from Clerk token
- **Header**: `X-Tenant-ID` for internal service communication

---

## Microservices

### Service Overview

| Service             | Port | Database   | Responsibility                |
| ------------------- | ---- | ---------- | ----------------------------- |
| **API Gateway**     | 3000 | -          | Auth, routing, rate limiting  |
| **Tenant Service**  | 3001 | tenant_db  | Tenant management, Clerk sync |
| **Product Service** | 3002 | product_db | Catalog, categories, variants |
| **Order Service**   | 3003 | order_db   | Orders, payments (future)     |

### Service Responsibilities

#### API Gateway (:3000)

```
• Validate JWT tokens from Clerk
• Extract tenant_id from JWT (orgId)
• Route requests to appropriate microservice
• Rate limiting per tenant
• Request/Response logging
• API composition (when needed)
```

#### Tenant Service (:3001)

```
• Receive Clerk webhooks (organization.created, etc.)
• Store tenant configuration
• Manage tenant domains
• Handle billing/subscription data
• Tenant-specific settings
```

#### Product Service (:3002)

```
• Product CRUD operations
• Category management
• Product variants (size, color)
• Product images
• Inventory tracking (basic)
```

#### Order Service (:3003) - Future

```
• Order creation
• Order items (with denormalized product data)
• Order status tracking
• Order history
• Payment integration
```

---

## Database Strategy

### Database per Service

Each microservice owns its database. **No foreign keys between services.**

```
PostgreSQL Engine (1 container)
│
├── tenant_db      ← Owned by Tenant Service
│   ├── tenants
│   ├── tenant_settings
│   ├── tenant_domains
│   └── tenant_billing
│
├── product_db     ← Owned by Product Service
│   ├── products (tenant_id)
│   ├── categories (tenant_id)
│   ├── product_variants (tenant_id)
│   └── product_images (tenant_id)
│
└── order_db       ← Owned by Order Service
    ├── orders (tenant_id)
    ├── order_items (tenant_id + denormalized product data)
    └── order_status_history (tenant_id)
```

### Migrations

Each service manages its own migrations:

```bash
# Run tenant service migrations
pnpm migration:tenant:run

# Run product service migrations
pnpm migration:product:run

# Run all migrations
pnpm migration:run:all
```

### Cross-Service Data

Since we can't use JOINs across databases, we use:

1. **Denormalization**: Copy essential data (e.g., product name/price in order_items)
2. **API Composition**: Gateway combines data from multiple services
3. **Events**: Services publish events, others update their read models

---

## Authentication Flow

### Clerk Integration

```
┌──────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User visits nike.tuapp.com                                  │
│                    │                                             │
│                    ▼                                             │
│  2. Clerk login modal appears                                   │
│     User logs in with email/Google/etc.                         │
│                    │                                             │
│                    ▼                                             │
│  3. Clerk returns JWT containing:                               │
│     {                                                            │
│       "sub": "user_123",                                        │
│       "org_id": "org_nike_456",     ← This is our tenant_id     │
│       "org_role": "admin",                                      │
│       ...                                                        │
│     }                                                            │
│                    │                                             │
│                    ▼                                             │
│  4. Frontend includes JWT in all API requests                   │
│     Authorization: Bearer eyJhbG...                             │
│                    │                                             │
│                    ▼                                             │
│  5. API Gateway validates JWT with Clerk                        │
│     Extracts: userId, orgId (tenant_id), role                   │
│                    │                                             │
│                    ▼                                             │
│  6. Request forwarded to microservice with headers:             │
│     X-Tenant-ID: org_nike_456                                   │
│     X-User-ID: user_123                                         │
│     X-User-Role: admin                                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Clerk Webhooks

Clerk sends webhooks when organizations change:

```
Clerk Event                    →  Our Action
─────────────────────────────────────────────────────
organization.created           →  Create tenant in tenant_db
organization.updated           →  Update tenant settings
organization.deleted           →  Soft-delete tenant
organizationMembership.created →  (Optional) Track members
```

---

## Request Flow Example

### Creating a Product

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  1. CLIENT (nike.tuapp.com)                                                     │
│     │                                                                            │
│     │  POST /api/products                                                       │
│     │  Authorization: Bearer eyJhbG... (JWT from Clerk)                         │
│     │  Body: { name: "Air Max", price: 150 }                                    │
│     │                                                                            │
│     ▼                                                                            │
│  2. API GATEWAY                                                                  │
│     │                                                                            │
│     │  a) Validate JWT with Clerk SDK                                           │
│     │  b) Extract: userId="user_123", orgId="org_nike_456"                      │
│     │  c) Verify permissions (role: admin?)                                     │
│     │  d) Add internal headers                                                  │
│     │                                                                            │
│     │  POST http://product-service:3002/products                                │
│     │  Headers:                                                                  │
│     │    X-Tenant-ID: org_nike_456                                              │
│     │    X-User-ID: user_123                                                    │
│     │                                                                            │
│     ▼                                                                            │
│  3. PRODUCT SERVICE                                                              │
│     │                                                                            │
│     │  a) Read X-Tenant-ID from header                                          │
│     │  b) Create product with tenant_id = "org_nike_456"                        │
│     │                                                                            │
│     │  INSERT INTO products (tenant_id, name, price)                            │
│     │  VALUES ('org_nike_456', 'Air Max', 150)                                  │
│     │                                                                            │
│     ▼                                                                            │
│  4. RESPONSE                                                                     │
│                                                                                  │
│     { id: "prod_789", tenant_id: "org_nike_456", name: "Air Max", price: 150 } │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Isolation

### How Tenant Data is Isolated

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              product_db.products                                 │
├──────────────┬────────────────┬─────────────┬───────────┬───────────────────────┤
│     id       │   tenant_id    │    name     │   price   │         ...           │
├──────────────┼────────────────┼─────────────┼───────────┼───────────────────────┤
│ prod_001     │ org_nike_456   │ Air Max     │   150.00  │                       │
│ prod_002     │ org_nike_456   │ Air Force   │   120.00  │                       │
│ prod_003     │ org_adidas_789 │ Ultraboost  │   180.00  │  ← Nike can't see     │
│ prod_004     │ org_adidas_789 │ Stan Smith  │    90.00  │  ← Nike can't see     │
│ prod_005     │ org_puma_123   │ RS-X        │   110.00  │                       │
└──────────────┴────────────────┴─────────────┴───────────┴───────────────────────┘
```

### Query Filtering

Every query **MUST** filter by `tenant_id`:

```sql
-- Nike's request: GET /api/products
SELECT * FROM products WHERE tenant_id = 'org_nike_456'

-- Result: Only Nike products
-- ├── Air Max
-- └── Air Force

-- Adidas's request: GET /api/products
SELECT * FROM products WHERE tenant_id = 'org_adidas_789'

-- Result: Only Adidas products
-- ├── Ultraboost
-- └── Stan Smith
```

### Index Strategy

Always include `tenant_id` first in composite indexes:

```sql
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_tenant_category ON products(tenant_id, category_id);
CREATE INDEX idx_products_tenant_sku ON products(tenant_id, sku);
```

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TECH STACK                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  BACKEND                          INFRASTRUCTURE                                │
│  ────────                         ──────────────                                │
│  • NestJS (TypeScript)            • Docker / Docker Compose                     │
│  • TypeORM (PostgreSQL)           • PostgreSQL 16                               │
│  • Clerk (Auth + Orgs)            • Redis (cache, future)                       │
│  • Joi (validation)               • RabbitMQ (events, future)                   │
│                                                                                  │
│  PATTERNS                         COMMUNICATION                                 │
│  ────────                         ─────────────                                 │
│  • Multi-tenant (shared DB)       • REST (sync)                                 │
│  • Database per service           • Events (async, future)                      │
│  • Repository pattern             • gRPC (internal, optional)                   │
│  • CQRS (future)                                                                │
│                                                                                  │
│  FUTURE ADDITIONS                                                               │
│  ────────────────                                                               │
│  • Elasticsearch (search)                                                       │
│  • S3/Cloudflare R2 (images)                                                    │
│  • Stripe (payments)                                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
multi-tenant-ecommerce/
├── apps/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── api-gateway.module.ts
│   │   │   ├── api-gateway.controller.ts
│   │   │   ├── api-gateway.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── index.ts
│   │   │   │   └── clerk-auth.guard.ts      ← JWT validation
│   │   │   └── middleware/
│   │   │       ├── index.ts
│   │   │       └── tenant.middleware.ts     ← Internal headers
│   │   └── tsconfig.app.json
│   │
│   ├── tenant-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── tenant-service.module.ts
│   │   │   ├── database/
│   │   │   │   ├── entities/
│   │   │   │   └── migrations/
│   │   │   ├── tenants/
│   │   │   └── webhooks/                    ← (future) Clerk webhooks
│   │   └── typeorm.config.ts
│   │
│   └── product-service/
│       ├── src/
│       │   ├── main.ts
│       │   ├── product-service.module.ts
│       │   ├── database/
│       │   │   ├── entities/
│       │   │   └── migrations/
│       │   ├── products/
│       │   └── categories/
│       └── typeorm.config.ts
│
├── libs/
│   └── common/
│       └── src/
│           ├── index.ts
│           ├── auth/                        ← Authentication module
│           │   ├── index.ts
│           │   ├── interfaces/
│           │   │   ├── index.ts
│           │   │   └── auth.interfaces.ts   ← User, Tenant, Request types
│           │   └── decorators/
│           │       ├── index.ts
│           │       ├── current-user.decorator.ts
│           │       ├── current-tenant.decorator.ts
│           │       ├── public.decorator.ts
│           │       └── roles.decorator.ts
│           └── database/
│               ├── index.ts
│               ├── base-tenant.entity.ts
│               ├── data-source.factory.ts
│               └── database.module.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── AUTHENTICATION.md                    ← New: Auth documentation
│
├── scripts/
│   ├── init-databases.sh
│   └── init-databases.sql
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## Patterns & Practices

### 1. Denormalization (Cross-Service Data)

When creating orders, we copy product data:

```typescript
// order_items table stores:
{
  productId: "prod_123",      // Reference only
  productName: "Air Max",     // Copied at order time
  productSku: "AM-001",       // Copied at order time
  unitPrice: 150.00,          // Price at time of purchase
  quantity: 2,
  totalPrice: 300.00
}
```

### 2. Saga Pattern (Future - Distributed Transactions)

For operations spanning multiple services:

```
Order Creation Saga:
1. Create Order (Order Service)     → Success
2. Reserve Inventory (Inventory)    → Success
3. Charge Payment (Payment)         → FAILS
4. Compensate: Release Inventory    ← Rollback
5. Compensate: Cancel Order         ← Rollback
```

### 3. Circuit Breaker (Future - Resilience)

Prevent cascading failures:

```
Service A → Service B

If Service B fails repeatedly:
  Circuit OPENS → Requests fail fast
  After cooldown → Circuit HALF-OPEN → Test requests
  If success → Circuit CLOSES → Normal operation
```

### 4. Outbox Pattern (Future - Event Reliability)

Guarantee event delivery:

```
1. Transaction:
   - INSERT INTO orders (...)
   - INSERT INTO outbox_events (event: 'OrderCreated', ...)
   - COMMIT

2. Background job:
   - SELECT FROM outbox_events WHERE published = false
   - Publish to RabbitMQ
   - UPDATE outbox_events SET published = true
```

---

## Running the Project

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- pnpm

### Development

```bash
# 1. Clone and install
pnpm install

# 2. Copy environment file
cp .env.example .env

# 3. Start infrastructure (PostgreSQL)
pnpm docker:up

# 4. Run migrations
pnpm migration:run:all

# 5. Start services (in separate terminals or use docker-compose)
pnpm start:gateway
pnpm start:tenants
pnpm start:products
```

### Docker Commands

```bash
pnpm docker:up        # Start all services
pnpm docker:up:build  # Rebuild and start
pnpm docker:down      # Stop all services
pnpm docker:logs      # View logs
pnpm docker:ps        # View running containers
```

### Migration Commands

```bash
pnpm migration:tenant:run      # Run tenant service migrations
pnpm migration:product:run     # Run product service migrations
pnpm migration:run:all         # Run all migrations
```

---

## Roadmap

### ✅ Implemented

- [x] Monorepo structure (NestJS)
- [x] API Gateway (basic)
- [x] Tenant Service (basic)
- [x] Product Service (basic)
- [x] Docker Compose configuration
- [x] PostgreSQL container
- [x] Environment configuration
- [x] TypeORM + Entities
- [x] Database migrations per service
- [x] DatabaseModule centralizado (libs/common)
- [x] **Clerk SDK integration** (`@clerk/backend`)
- [x] **ClerkAuthGuard** (JWT validation with Clerk v2)
- [x] **TenantMiddleware** (internal headers for microservices)
- [x] **Auth decorators** (`@CurrentUser`, `@CurrentTenant`, `@Public`, `@Roles`)
- [x] **AuthenticatedRequest interface** (typed Express request)

### 📋 To Implement

- [ ] Clerk Webhooks (organization sync)
- [ ] HTTP Proxy to microservices
- [ ] Internal headers guard for microservices
- [ ] Complete CRUD operations
- [ ] Order Service
- [ ] RabbitMQ + Events
- [ ] Saga pattern
- [ ] Unit & Integration tests
- [ ] API documentation (Swagger)

### 🔮 Future Considerations

- [ ] Elasticsearch for product search
- [ ] Redis for caching
- [ ] Rate limiting per tenant
- [ ] Stripe integration
- [ ] Admin dashboard
- [ ] Analytics service

---

## Related Documentation

- [📖 DATABASE.md](./DATABASE.md) - Database configuration, entities, and migrations
- [🔐 AUTHENTICATION.md](./AUTHENTICATION.md) - Clerk integration, guards, and decorators

---

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [Clerk Documentation](https://clerk.com/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [Microservices Patterns (Chris Richardson)](https://microservices.io/patterns/)
- [Building Microservices (Sam Newman)](https://samnewman.io/books/building_microservices/)
