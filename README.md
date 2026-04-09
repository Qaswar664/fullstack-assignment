# fullstack-assignment

This is a take-home assignment — a multi-tenant CRM built with NestJS on the backend and Next.js on the frontend. Both live in this repo under their own folders.

The idea is simple: an admin creates an organization, adds team members, and those members manage customers. Everything is scoped to the organization so no data leaks between tenants.

---

## What's inside

```
fullstack-assignment/
├── backend/     # NestJS API (auth, orgs, users, customers, notes, activity logs)
└── frontend/    # Next.js dashboard UI
```

---

## Stack

**Backend** — NestJS + PostgreSQL + Prisma + JWT auth + Swagger

**Frontend** — Next.js 16 (App Router) + Tailwind CSS + shadcn/ui + React Query + Axios

---

## Running locally

You'll need Node.js 20+ and a PostgreSQL database.

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your database details:

```env
DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5432/assignment_db"
JWT_SECRET="change-this-in-production"
JWT_REFRESH_SECRET="change-this-too"
JWT_EXPIRES_IN="86400"
PORT=5000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000"
```

Then run migrations and seed the database:

```bash
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

API is at `http://localhost:5000` — Swagger docs at `http://localhost:5000/api` (dev only).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

```bash
npm run dev
```

App is at `http://localhost:3000`.

---

## Default login after seeding

| | |
|--|--|
| Email | `admin@gmail.com` |
| Password | `admin123` |

---

## How it works

1. Admin logs in with the seeded account
2. Admin creates an organization
3. Admin creates member users — they get linked to the org automatically
4. Members log in and can create/manage customers
5. Customers can be assigned to members (max 5 active per member — enforced in a DB transaction)
6. Notes can be added to any customer, with author tracking
7. Every action (create, update, delete, restore, assign, note added) is logged in the activity log

---

## API overview

All routes are under `/api/v1`. Full interactive docs available via Swagger in dev.

| | Method | Route |
|--|--|--|
| Login | POST | `/auth/login` |
| Logout | POST | `/auth/logout` |
| My org | GET | `/organizations/me` |
| Create org | POST | `/organizations` |
| Update org | PATCH | `/organizations/me` |
| List users | GET | `/users` |
| Create user | POST | `/users` |
| Update user | PATCH | `/users/:id` |
| Delete user | DELETE | `/users/:id` |
| List customers | GET | `/customers` |
| Create customer | POST | `/customers` |
| Update customer | PATCH | `/customers/:id` |
| Soft delete | DELETE | `/customers/:id` |
| Restore | PATCH | `/customers/:id/restore` |
| Permanent delete | DELETE | `/customers/:id/permanent` |
| Assign customer | PATCH | `/customers/:id/assign` |
| Customer notes | GET/POST/DELETE | `/customers/:id/notes` |
| Activity logs | GET | `/activity-logs` |

---

## Deployment

Backend → Railway (root directory: `backend/`)

Frontend → Vercel (root directory: `frontend/`)

Both can be deployed independently from this repo. See `backend/README.md` for the architecture decisions, concurrency approach, performance strategy, and trade-offs.
