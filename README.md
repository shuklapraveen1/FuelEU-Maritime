# 🚢 FuelEU Maritime Compliance Platform

A production-grade full-stack platform for managing maritime route compliance under the **FuelEU Maritime Regulation (EU) 2023/1805**.

---

## Architecture Overview

This platform is built with **Hexagonal Architecture** (Ports & Adapters), **Clean Architecture**, and **Domain-Driven Design** principles.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  adapters/ui ──── core/domain ──── adapters/infrastructure      │
│   (React)          (Types)           (Axios API Client)         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP (REST)
┌─────────────────────────▼───────────────────────────────────────┐
│                       Backend (Node.js)                         │
│                                                                 │
│  inbound/http        application          outbound/postgres      │
│  (Controllers)  ──►  (Use Cases)   ──►   (Prisma Repos)        │
│                          │                      │               │
│                    core/domain              PostgreSQL           │
│              (Entities + Domain Services)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Layer | Responsibility | Dependencies |
|-------|---------------|--------------|
| `core/domain` | Business rules, entities, domain services | None |
| `core/application` | Use case orchestration | Domain only |
| `core/ports` | Repository interfaces | Domain types |
| `adapters/inbound/http` | Express controllers, request validation | Application layer |
| `adapters/outbound/postgres` | Prisma repository implementations | Ports + Prisma |
| `infrastructure/server` | App wiring (composition root), Express config | All adapters |

The domain layer has **zero dependencies** on frameworks, ORMs, or HTTP libraries — it is purely business logic and can be tested in isolation with no test doubles needed.

---

## Features

### Routes Tab
- View all maritime routes with vessel type, fuel type, GHG intensity, and emissions data
- Filter by vessel type, fuel type, and year
- Set any route as the compliance baseline (one at a time)
- Visual compliance indicators vs. FuelEU target intensity

### Compare Tab
- Compare all routes against the baseline GHG intensity
- Bar chart showing intensity per route vs. target line (89.3368 gCO₂eq/MJ)
- Percent difference formula: `((comparison / baseline) − 1) × 100`
- Compliant / Non-compliant status per route

### Banking Tab _(Article 20)_
- KPI cards: CB Before / Banked / CB After
- Bar chart of per-ship compliance balances
- Bank surplus CB for future use
- Apply banked surplus to offset current or future deficits
- Buttons disabled when CB ≤ 0 (no surplus to bank)

### Pooling Tab _(Article 21)_
- View adjusted compliance balances (CB minus banked)
- Multi-select ships to form a pool
- Real-time pool validity check (sum must be ≥ 0)
- Pie chart of selected ship balances
- Pool result shows CB before/after per member
- Green/red validity indicator

---

## Tech Stack

### Backend
| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 | Runtime |
| TypeScript | 5.3 | Type safety |
| Express | 4.18 | HTTP server |
| Prisma | 5.7 | ORM + migrations |
| PostgreSQL | 16 | Database |
| Zod | 3.22 | Request validation |
| Jest + Supertest | 29 / 6 | Unit + integration tests |
| Swagger/OpenAPI | 3.0 | API documentation |

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.3 | Type safety |
| Vite | 5 | Build tool |
| TailwindCSS | 3.4 | Styling |
| React Query | 5 | Server state |
| Zustand | 4.4 | Global UI state |
| Recharts | 2.10 | Charts |
| Axios | 1.6 | HTTP client |
| Zod | 3.22 | Schema validation |

---

## Repository Structure

```
FuelEU-Maritime/
├── docker-compose.yml
├── README.md
├── AGENT_WORKFLOW.md
├── REFLECTION.md
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma               # Database schema
│   │   └── migrations/                 # SQL migrations
│   └── src/
│       ├── core/
│       │   ├── domain/
│       │   │   ├── Route.ts            # Route entity
│       │   │   ├── Compliance.ts       # Compliance entities + constants
│       │   │   ├── ComplianceCalculator.ts  # CB formula (pure)
│       │   │   ├── BankingService.ts   # Article 20 logic (pure)
│       │   │   └── PoolingAlgorithm.ts # Article 21 algorithm (pure)
│       │   ├── application/
│       │   │   ├── RouteUseCases.ts
│       │   │   └── ComplianceUseCases.ts
│       │   └── ports/
│       │       ├── IRouteRepository.ts
│       │       └── IComplianceRepository.ts
│       ├── adapters/
│       │   ├── inbound/http/
│       │   │   ├── routesController.ts
│       │   │   └── complianceController.ts
│       │   └── outbound/postgres/
│       │       ├── PrismaRouteRepository.ts
│       │       └── PrismaComplianceRepository.ts
│       ├── infrastructure/
│       │   ├── db/
│       │   │   ├── prismaClient.ts
│       │   │   └── seed.ts
│       │   └── server/
│       │       ├── app.ts              # Composition root
│       │       ├── index.ts            # Server entry point
│       │       └── swagger.ts
│       ├── shared/
│       │   └── errorHandler.ts
│       └── __tests__/
│           ├── ComplianceCalculator.test.ts
│           ├── BankingService.test.ts
│           ├── PoolingAlgorithm.test.ts
│           ├── routes.integration.test.ts
│           └── compliance.integration.test.ts
│
└── frontend/
    └── src/
        ├── core/
        │   ├── domain/types.ts         # Domain interfaces (no React)
        │   └── application/calculations.ts  # Pure calculation functions
        ├── adapters/
        │   ├── infrastructure/
        │   │   └── apiClient.ts        # Axios client
        │   └── ui/
        │       ├── hooks/useApi.ts     # React Query hooks
        │       ├── components/
        │       │   ├── primitives.tsx  # Badge, Button, KpiCard, Table…
        │       │   ├── Sidebar.tsx
        │       │   ├── Topbar.tsx
        │       │   └── Toast.tsx
        │       └── pages/
        │           ├── DashboardLayout.tsx
        │           ├── RoutesPage.tsx
        │           ├── ComparePage.tsx
        │           ├── BankingPage.tsx
        │           └── PoolingPage.tsx
        └── shared/
            ├── store.ts                # Zustand global state
            └── utils.ts               # Formatters + helpers
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- npm 9+

### Option A — Docker Compose (Recommended)

```bash
# Clone and start everything
git clone <repo>
cd FuelEU-Maritime

docker-compose up --build

# The platform will be available at:
# Frontend:    http://localhost:5173
# Backend API: http://localhost:4000/api
# Swagger:     http://localhost:4000/api-docs
```

### Option B — Local Development

**1. Start PostgreSQL**
```bash
docker-compose up postgres -d
```

**2. Backend**
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

**3. Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

**4. Open the app**
```
http://localhost:5173
```

---

## API Reference

Full OpenAPI documentation is available at `http://localhost:4000/api-docs` when the backend is running.

### Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/routes` | List all routes (supports `?vesselType`, `?fuelType`, `?year`) |
| `POST` | `/api/routes/:routeId/baseline` | Set route as compliance baseline |
| `GET` | `/api/routes/comparison` | Compare all routes against baseline |
| `GET` | `/api/compliance/cb` | Get compliance balance summaries |
| `GET` | `/api/compliance/adjusted-cb` | Get adjusted CBs (after banking) |
| `GET` | `/api/banking/records` | Get all bank entries |
| `POST` | `/api/banking/bank` | Bank surplus CB (Article 20) |
| `POST` | `/api/banking/apply` | Apply banked surplus |
| `POST` | `/api/pools` | Create compliance pool (Article 21) |

---

## Compliance Formulas

### Compliance Balance (Article 4)
```
energy  = fuelConsumption (tonnes) × 41,000 MJ/tonne
CB      = (targetIntensity − actualIntensity) × energy

targetIntensity = 89.3368 gCO₂eq/MJ
CB > 0  → surplus  (below target — compliant)
CB < 0  → deficit  (above target — non-compliant)
```

### Route Comparison
```
percentDiff = ((comparison.ghgIntensity / baseline.ghgIntensity) − 1) × 100
```

### Banking (Article 20)
```
CB after banking  = CB before − banked amount
CB after applying = CB before + banked amount
```

### Pooling (Article 21)
```
Pool is valid if:
  sum(adjustedCB) >= 0               ← pool must collectively comply
  ∀ deficit ship:  cbAfter >= cbBefore  ← deficit cannot worsen
  ∀ surplus ship:  cbAfter >= 0         ← surplus cannot go negative
```

---

## Running Tests

```bash
cd backend

# Unit tests only (no DB needed)
npm test -- --testPathPattern="Calculator|Banking|Pooling"

# All tests (requires running PostgreSQL)
npm test

# With coverage report
npm run test:coverage
```

---

## Environment Variables

### Backend (`.env`)
```env
DATABASE_URL="postgresql://fueleu:fueleu@localhost:5432/fueleu_db"
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:4000/api
```

---

## Seed Data

The seed script inserts 5 routes and their corresponding compliance records:

| Route | Vessel | Fuel | Year | GHG (gCO₂/MJ) | Status |
|-------|--------|------|------|----------------|--------|
| R001 | Container | HFO | 2024 | 91.0 | ❌ Deficit |
| R002 | BulkCarrier | LNG | 2024 | 88.0 | ✅ Surplus |
| R003 | Tanker | MGO | 2024 | 93.5 | ❌ Deficit |
| R004 | RoRo | HFO | 2025 | 89.2 | ✅ Surplus (barely) |
| R005 | Container | LNG | 2025 | 90.5 | ❌ Deficit |

Target: **89.3368 gCO₂eq/MJ**
