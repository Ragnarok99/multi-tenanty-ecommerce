# 🔐 Authentication & Authorization

This document describes the authentication and authorization implementation using **Clerk** in the Multi-Tenant Ecommerce platform.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Clerk Integration](#clerk-integration)
3. [JWT Structure](#jwt-structure)
4. [API Gateway Guards](#api-gateway-guards)
5. [Decorators](#decorators)
6. [Middleware](#middleware)
7. [Request Flow](#request-flow)
8. [Configuration](#configuration)
9. [Testing](#testing)

---

## Overview

We use **Clerk** as our authentication provider. Clerk handles:

- User authentication (email, social logins)
- Organization management (our tenants)
- JWT token generation
- Role-based access control within organizations

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION STACK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CLERK (External)                                              │
│   ├── User Management                                           │
│   ├── Organizations = Tenants                                   │
│   ├── JWT Generation                                            │
│   └── Webhooks                                                  │
│                                                                  │
│   API GATEWAY                                                    │
│   ├── ClerkAuthGuard (JWT validation)                           │
│   ├── TenantMiddleware (internal headers)                       │
│   └── Decorators (@CurrentUser, @CurrentTenant, etc.)          │
│                                                                  │
│   MICROSERVICES                                                  │
│   └── Read internal headers (X-Tenant-ID, X-User-ID)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Clerk Integration

### Dependencies

```bash
pnpm add @clerk/backend
```

### How Clerk Maps to Multi-Tenancy

| Clerk Concept     | Our Concept | Description                    |
| ----------------- | ----------- | ------------------------------ |
| User              | User        | Person using the platform      |
| Organization      | Tenant      | A store (Nike, Adidas, etc.)   |
| Organization ID   | tenant_id   | Primary key for data isolation |
| Organization Role | Role        | `org:admin`, `org:member`      |

### Single App, Multiple Organizations

```
┌─────────────────────────────────────────────────────────────┐
│                  YOUR CLERK APPLICATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  Org: Nike  │  │ Org: Adidas │  │  Org: Puma  │  ...   │
│   │  (tenant)   │  │  (tenant)   │  │  (tenant)   │        │
│   │             │  │             │  │             │        │
│   │ 👤 Admin    │  │ 👤 Admin    │  │ 👤 Admin    │        │
│   │ 👤 Staff    │  │ 👤 Staff    │  │ 👤 Member   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│   A user can belong to multiple organizations               │
└─────────────────────────────────────────────────────────────┘
```

---

## JWT Structure

### Clerk v2 JWT Claims

When a user authenticates with an active organization, Clerk returns a JWT with these claims:

```typescript
{
  // Standard claims
  "sub": "user_2abc123...",        // User ID
  "sid": "sess_xyz789...",         // Session ID
  "iat": 1701792000,               // Issued at
  "exp": 1701795600,               // Expiration
  "iss": "https://your-app.clerk.accounts.dev",
  "azp": "http://localhost:3000",  // Authorized party

  // Organization claims (Clerk v2 format)
  "o": {
    "id": "org_nike456",           // Organization ID (tenant_id)
    "slg": "nike",                 // Slug
    "rol": "admin",                // Role WITHOUT "org:" prefix
    "per": "manage,read"           // Permissions (comma-separated)
  }
}
```

### Important Notes

- **`o.id`** = Organization ID = Your `tenant_id`
- **`o.rol`** = Role without prefix (we add `org:` prefix in the guard)
- If user has no active organization, `o` will be `undefined`

---

## API Gateway Guards

### ClerkAuthGuard

Located at: `apps/api-gateway/src/guards/clerk-auth.guard.ts`

The guard:

1. Checks if endpoint is public (`@Public()` decorator)
2. Extracts Bearer token from `Authorization` header
3. Validates JWT using Clerk's `verifyToken()` function
4. Extracts user and organization info from claims
5. Verifies user belongs to an organization
6. Checks role requirements (`@Roles()` decorator)
7. Attaches `user` and `tenant` to request object

```typescript
// Simplified flow
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if public
    if (isPublic) return true;

    // 2. Get token
    const token = this.extractTokenFromHeader(request);

    // 3. Verify with Clerk
    const verifiedToken = await verifyToken(token, {
      secretKey: this.secretKey,
    });

    // 4. Extract org claims (Clerk v2)
    const orgClaims = verifiedToken.o;

    // 5. Build user object
    const user: AuthenticatedUser = {
      userId: verifiedToken.sub,
      tenantId: orgClaims?.id || null,
      role: orgClaims?.rol ? `org:${orgClaims.rol}` : null,
    };

    // 6. Require organization
    if (!user.tenantId) {
      throw new UnauthorizedException('Must belong to an organization');
    }

    // 7. Attach to request
    request.user = user;
    request.tenant = { tenantId: user.tenantId };

    return true;
  }
}
```

### Global Guard Registration

The guard is registered globally in `ApiGatewayModule`:

```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class ApiGatewayModule {}
```

---

## Decorators

Located at: `libs/common/src/auth/decorators/`

### @Public()

Mark endpoints that don't require authentication:

```typescript
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

### @CurrentUser()

Extract authenticated user from request:

```typescript
@Get('profile')
getProfile(@CurrentUser() user: AuthenticatedUser) {
  return { userId: user.userId, role: user.role };
}

// Or get specific property
@Get('my-id')
getMyId(@CurrentUser('userId') userId: string) {
  return { userId };
}
```

### @CurrentTenant()

Extract tenant context from request:

```typescript
@Get('products')
getProducts(@CurrentTenant() tenant: TenantContext) {
  return this.productService.findByTenant(tenant.tenantId);
}

// Or get specific property
@Get('products')
getProducts(@CurrentTenant('tenantId') tenantId: string) {
  return this.productService.findByTenant(tenantId);
}
```

### @Roles()

Require specific roles to access endpoint:

```typescript
@Roles('org:admin')
@Delete(':id')
deleteProduct(@Param('id') id: string) {
  return this.productService.delete(id);
}

// Multiple roles (OR - any of the roles)
@Roles('org:admin', 'org:manager')
@Put(':id')
updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
  return this.productService.update(id, dto);
}
```

---

## Middleware

### TenantMiddleware

Located at: `apps/api-gateway/src/middleware/tenant.middleware.ts`

After the guard authenticates the user, this middleware adds internal headers for microservice communication:

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.user && req.tenant) {
      // Add headers for internal service communication
      req.headers['x-tenant-id'] = req.tenant.tenantId;
      req.headers['x-user-id'] = req.user.userId;

      if (req.user.role) {
        req.headers['x-user-role'] = req.user.role;
      }
    }
    next();
  }
}
```

### Internal Headers

| Header        | Description                         |
| ------------- | ----------------------------------- |
| `X-Tenant-ID` | Organization ID (tenant identifier) |
| `X-User-ID`   | User ID from Clerk                  |
| `X-User-Role` | User's role in the organization     |

---

## Request Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REQUEST FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. CLIENT                                                               │
│     │                                                                    │
│     │  GET /api/products                                                │
│     │  Authorization: Bearer eyJhbG...                                  │
│     │                                                                    │
│     ▼                                                                    │
│  2. API GATEWAY - ClerkAuthGuard                                        │
│     │                                                                    │
│     │  ✓ Validate JWT with Clerk                                        │
│     │  ✓ Extract user (sub) and org (o.id, o.rol)                       │
│     │  ✓ Verify org membership                                          │
│     │  ✓ Check role requirements                                        │
│     │  ✓ Attach user & tenant to request                                │
│     │                                                                    │
│     ▼                                                                    │
│  3. API GATEWAY - TenantMiddleware                                      │
│     │                                                                    │
│     │  ✓ Add X-Tenant-ID header                                         │
│     │  ✓ Add X-User-ID header                                           │
│     │  ✓ Add X-User-Role header                                         │
│     │                                                                    │
│     ▼                                                                    │
│  4. MICROSERVICE (Product Service)                                      │
│     │                                                                    │
│     │  Read headers:                                                    │
│     │    X-Tenant-ID: org_nike456                                       │
│     │    X-User-ID: user_abc123                                         │
│     │                                                                    │
│     │  Query: SELECT * FROM products WHERE tenant_id = 'org_nike456'   │
│     │                                                                    │
│     ▼                                                                    │
│  5. RESPONSE                                                             │
│                                                                          │
│     [{ id: "prod_1", name: "Air Max", tenant_id: "org_nike456" }]       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

```env
# Required for API Gateway
CLERK_SECRET_KEY=sk_test_xxxxx

# Optional (for frontend)
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Optional (for webhooks)
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

### Clerk Dashboard Setup

1. **Create Application**
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Create new application

2. **Enable Organizations**
   - Configure → Organizations → Enable

3. **Configure Roles** (optional)
   - Default: `org:admin`, `org:member`
   - Add custom roles as needed

4. **Get API Keys**
   - Configure → API Keys
   - Copy `Secret Key` to `.env`

---

## Testing

### Public Endpoints

```bash
# Should work without authentication
curl http://localhost:3000/health
# Response: { "status": "ok" }
```

### Protected Endpoints (without token)

```bash
curl http://localhost:3000/me
# Response: 401 Unauthorized
# { "message": "Token de autenticación no proporcionado" }
```

### Protected Endpoints (with token)

```bash
curl http://localhost:3000/me \
  -H "Authorization: Bearer eyJhbG..."
# Response: { "user": { "id": "user_xxx" }, "tenant": { "id": "org_xxx" } }
```

### Getting a Test Token

1. **From Clerk Dashboard**
   - Users → Select user → View profile → Sessions → Copy token

2. **From Frontend**
   ```javascript
   const token = await clerk.session.getToken();
   console.log(token);
   ```

---

## Interfaces

### AuthenticatedUser

```typescript
interface AuthenticatedUser {
  userId: string; // Clerk user ID (sub claim)
  tenantId: string | null; // Organization ID (o.id claim)
  role: string | null; // Role with prefix (e.g., "org:admin")
  email?: string;
  fullName?: string;
  imageUrl?: string;
  sessionClaims?: Record<string, unknown>;
}
```

### TenantContext

```typescript
interface TenantContext {
  tenantId: string; // Organization ID
  subdomain?: string; // Extracted from request host
}
```

### AuthenticatedRequest

```typescript
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  tenant: TenantContext | null;
}
```

---

## Related Documentation

- [📖 ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [📖 DATABASE.md](./DATABASE.md) - Database configuration and entities
- [🔗 Clerk Documentation](https://clerk.com/docs)
- [🔗 Clerk Backend SDK](https://clerk.com/docs/references/backend/overview)
