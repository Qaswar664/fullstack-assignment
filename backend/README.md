# Multi-Tenant CRM — Backend

A production-ready REST API for a Multi-Tenant CRM System built with **NestJS**, **PostgreSQL**, and **Prisma**.

## Tech Stack

- **Framework**: NestJS 11 (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Authentication**: JWT (access + refresh tokens) via Passport.js
- **Validation**: class-validator + class-transformer
- **API Docs**: Swagger (development only)
- **Rate Limiting**: @nestjs/throttler

---

## Getting Started (Local Setup)

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then fill in your values in `.env`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5432/assignment_db"
JWT_SECRET="your-strong-jwt-secret"
JWT_REFRESH_SECRET="your-strong-refresh-secret"
JWT_EXPIRES_IN="86400"
PORT=5000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000"
```

### 3. Run database migrations

```bash
npx prisma migrate dev
```

### 4. Seed the database (creates default admin user)

```bash
npx prisma db seed
```

Default admin credentials:
- **Email**: `admin@gmail.com`
- **Password**: `admin123`

### 5. Start the server

```bash
npm run dev
```

Server runs at `http://localhost:5000`
Swagger docs at `http://localhost:5000/api` (development only)

---

## API Endpoints

All endpoints are prefixed with `/api/v1`

| Module | Method | Endpoint | Auth |
|---|---|---|---|
| Health | GET | `/` | No |
| Auth | POST | `/api/v1/auth/login` | No |
| Auth | POST | `/api/v1/auth/refresh` | Refresh token |
| Auth | POST | `/api/v1/auth/logout` | Yes |
| Organizations | POST | `/api/v1/organizations` | Admin |
| Organizations | GET | `/api/v1/organizations/me` | Yes |
| Organizations | PATCH | `/api/v1/organizations/me` | Admin |
| Organizations | DELETE | `/api/v1/organizations/me` | Admin |
| Users | POST | `/api/v1/users` | Admin |
| Users | GET | `/api/v1/users` | Yes |
| Users | GET | `/api/v1/users/:id` | Yes |
| Users | PATCH | `/api/v1/users/:id` | Admin |
| Users | DELETE | `/api/v1/users/:id` | Admin |
| Customers | POST | `/api/v1/customers` | Yes |
| Customers | GET | `/api/v1/customers` | Yes |
| Customers | GET | `/api/v1/customers/:id` | Yes |
| Customers | PATCH | `/api/v1/customers/:id` | Yes |
| Customers | DELETE | `/api/v1/customers/:id` | Yes |
| Customers | PATCH | `/api/v1/customers/:id/restore` | Yes |
| Customers | PATCH | `/api/v1/customers/:id/assign` | Yes |
| Customers | DELETE | `/api/v1/customers/:id/permanent` | Admin |
| Notes | POST | `/api/v1/customers/:id/notes` | Yes |
| Notes | GET | `/api/v1/customers/:id/notes` | Yes |
| Notes | DELETE | `/api/v1/customers/:id/notes/:noteId` | Yes |
| Activity Logs | GET | `/api/v1/activity-logs` | Yes |
| Activity Logs | GET | `/api/v1/activity-logs/customer/:id` | Yes |

---

## Architecture Decisions

### Modular Structure
Each feature is a self-contained NestJS module (`auth`, `users`, `organizations`, `customers`, `notes`, `activity-logs`). Each module has its own controller, service, and DTOs. This makes the codebase easy to navigate, test, and extend.

### Separate Controller and Service Layers
Controllers handle HTTP concerns only (request parsing, response formatting, guards). All business logic lives in services. This enforces a clean separation of concerns.

### Prisma with explicit `select`
Every Prisma query uses an explicit `select` statement instead of fetching full records. This prevents accidental exposure of sensitive fields (e.g. `password`, `refreshToken`) and reduces data transfer from the database.

### Standard API Response Format
All endpoints return a consistent response shape:
```json
{
  "success": true,
  "message": "Customer created successfully",
  "statusCode": 201,
  "data": { ... }
}
```
This makes frontend integration predictable and error handling uniform.

---

## Multi-Tenancy Isolation

Every database query that reads or writes organization-specific data includes an `organizationId` filter in the `where` clause. This is enforced at the **service layer**, not just the controller, so it cannot be bypassed.

- Customers, Notes, and Activity Logs are always scoped to `organizationId`
- Users can only see and manage data within their own organization
- The `organizationId` is extracted from the authenticated JWT token — the client cannot manipulate it

---

## Concurrency Safety

Each user can have a **maximum of 5 active customers** assigned at a time.

The limit check is performed **inside a `prisma.$transaction`** block:

```typescript
return this.prisma.$transaction(async (tx) => {
  const activeCount = await tx.customer.count({
    where: {
      assignedToId,
      organizationId,
      deletedAt: null,
      NOT: { id }, // exclude the customer being reassigned
    },
  });

  if (activeCount >= 5) {
    throw new BadRequestException('User already has 5 active customers assigned.');
  }

  await tx.customer.update({ ... });
});
```

By performing the count and update inside the same transaction, two concurrent requests cannot both pass the check and exceed the limit simultaneously. PostgreSQL's transaction isolation ensures the count reflects all committed state at the time of the read.

---

## Performance Strategy and Indexing

The system is designed to support **100,000+ customers per organization**.

### Database Indexes

| Model | Indexed Fields | Reason |
|---|---|---|
| Customer | `organizationId` | All customer queries filter by org |
| Customer | `assignedToId` | Assignment queries and counts |
| Customer | `deletedAt` | Soft delete filter on every list query |
| Customer | `name` | Search by name |
| User | `email` | Login lookup and uniqueness check |
| User | `organizationId` | Org-scoped user queries |
| ActivityLog | `organizationId` | Scoped log queries |
| ActivityLog | `customerId` | Customer-specific log filter |
| ActivityLog | `performedById` | User-specific log filter |

### Avoiding N+1 Queries
All list queries use Prisma `include`/`select` with nested relations in a single query. No additional queries are made per record.

### Efficient Pagination
All list endpoints use `skip`/`take` with a parallel `count` query inside a transaction, returning total count and page metadata in one round trip.

---

## Soft Delete Integrity

When a customer is soft-deleted (`deletedAt` is set to a timestamp):
- They are excluded from all normal list and search queries (`deletedAt: null` filter)
- Their **notes remain stored** in the database (no cascade delete on soft delete)
- Their **activity logs remain stored** (`onDelete: SetNull` on the `customerId` foreign key)
- Restoring the customer (`deletedAt` set back to `null`) restores full visibility of notes and logs

Hard deletion (if it ever occurs) cascades to notes via `onDelete: Cascade` on the database relation.

---

## Scaling Strategy

To scale this system:

1. **Read replicas** — separate read-heavy queries (list customers, activity logs) to a PostgreSQL read replica
2. **Connection pooling** — use PgBouncer or Prisma Accelerate to manage database connections under high load
3. **Redis caching** — cache organization and user lookups that are read frequently and rarely change
4. **Horizontal scaling** — NestJS is stateless (JWT auth), so multiple instances can run behind a load balancer without shared session state
5. **Queue for activity logging** — move activity log writes to a background queue (e.g. BullMQ) to avoid slowing down the main transaction

---

## Trade-offs

| Decision | Trade-off |
|---|---|
| JWT stateless auth | Cannot instantly revoke tokens; mitigated by hashed refresh token stored in DB and logout clearing it |
| Soft delete via `deletedAt` | Slightly more complex queries; benefit is full data recovery and audit trail |
| Concurrency via DB transaction | Simpler than pessimistic locking; sufficient for this scale |
| Activity logs written synchronously | Simpler implementation; at scale should move to a queue |
| `organizationId` in JWT payload | Avoids a DB lookup per request; trade-off is token must be reissued if org changes |

---

## Production Improvement

**Rate Limiting** was implemented using `@nestjs/throttler`.

**Reasoning**: A CRM API handles sensitive business data and authentication endpoints. Without rate limiting, login endpoints are vulnerable to brute-force attacks and the API is vulnerable to abuse under high request volume. The throttler limits each IP to 100 requests per 60 seconds globally, protecting all endpoints with zero per-route configuration overhead.

**Swagger API Documentation** was also implemented, available only in development (`NODE_ENV !== 'production'`). This gives developers a full interactive reference without exposing internal API structure in production.

---

## Seed Data

The seed creates one default super admin:

| Field | Value |
|---|---|
| Email | `admin@gmail.com` |
| Password | `admin123` |
| Role | `admin` |
| Organization | None (create one after first login) |
