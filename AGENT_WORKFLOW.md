# AGENT_WORKFLOW.md

## AI-Assisted Development Process

This document describes how Claude (Anthropic) was used as an AI engineering agent to architect and implement the FuelEU Maritime Compliance Platform.

---

## Development Approach

### Phase 1 — Architecture Design

The AI agent was first tasked with:
1. Analysing the FuelEU Maritime Regulation requirements (Articles 4, 20, 21)
2. Selecting the appropriate architecture pattern — **Hexagonal Architecture** was chosen because it perfectly separates the volatile compliance formulas (domain) from the volatile infrastructure (HTTP, database) and the volatile UI (React)
3. Mapping regulation concepts to domain entities:
   - *Route* → `Route` entity with GHG intensity and fuel consumption
   - *Compliance Balance* → `ComplianceCalculator` domain service
   - *Banking* → `BankingService` domain service (Article 20)
   - *Pooling* → `PoolingAlgorithm` domain service (Article 21)

### Phase 2 — Domain Layer First

Following the **Domain-First** approach advocated by DDD, the agent implemented the domain layer before any infrastructure:

```
core/domain/
  ComplianceCalculator.ts  ← CB = (Target − Actual) × Energy
  BankingService.ts        ← Article 20 surplus banking
  PoolingAlgorithm.ts      ← Article 21 transfer algorithm
```

This ensured the business logic could be **unit tested** with zero test doubles, zero mocking, and no database.

### Phase 3 — Ports (Interfaces)

After the domain was complete, the agent defined the outbound ports as TypeScript interfaces:

```
core/ports/
  IRouteRepository.ts
  IComplianceRepository.ts
```

These interfaces allow the domain/application layer to depend on **abstractions**, not concrete implementations — following the **Dependency Inversion Principle**.

### Phase 4 — Application Layer

Use case classes were written to orchestrate the domain services and repositories:

```
core/application/
  RouteUseCases.ts
  ComplianceUseCases.ts
```

Each use case method represents a single user-visible action (e.g., `bankSurplus`, `createPool`).

### Phase 5 — Adapters

With the domain, ports, and use cases complete, the agent implemented the adapters:
- **Inbound**: Express controllers with Zod validation
- **Outbound**: Prisma repository implementations mapping DB models → domain entities

### Phase 6 — Infrastructure Wiring (Composition Root)

`infrastructure/server/app.ts` is the **composition root** — the single place where all concrete implementations are instantiated and wired together via constructor injection.

### Phase 7 — Frontend

The frontend mirrors the hexagonal pattern:
- `core/domain/types.ts` — TypeScript interfaces (no React)
- `core/application/calculations.ts` — Pure calculation functions
- `adapters/infrastructure/apiClient.ts` — Axios HTTP adapter
- `adapters/ui/hooks/useApi.ts` — React Query hooks (inbound adapter)
- `adapters/ui/pages/` — React components (UI adapter)

---

## Prompting Strategy

The AI agent was directed with a **comprehensive specification** covering:
- Business domain (FuelEU Regulation, Articles 4/20/21)
- Architecture requirements (Hexagonal, DDD, SOLID)
- Technical stack (specific library versions)
- Data model (exact schema and seed data)
- Compliance formulas (exact mathematical formulas)
- Quality requirements (production-grade, no pseudocode)

Key prompting techniques used:
1. **Domain language anchoring** — using regulation-specific terminology (`compliance balance`, `banking`, `pooling`) to ground the implementation in the business domain
2. **Architecture constraints** — explicitly requiring hexagonal layers to prevent framework coupling in the domain
3. **Formula specification** — providing exact formulas prevented rounding errors or interpretation mistakes
4. **File-by-file generation** — generating one file at a time with path headers ensured completeness and reviewability

---

## AI Limitations Encountered

1. **Context window management** — The full repository exceeds a single context window; generation was split across multiple continuation prompts
2. **Test data coupling** — Integration tests require a running database; the AI correctly flagged this and used `beforeAll` hooks for setup
3. **Formula precision** — The CB calculation uses floating-point arithmetic; the AI added `toBeCloseTo` matchers in tests rather than exact equality

---

## Code Quality Verification

The AI was instructed to follow these quality gates:
- TypeScript strict mode (`"strict": true`)
- ESLint with `@typescript-eslint` ruleset
- All async operations wrapped with error handling
- Domain services have no `async` methods (no I/O allowed in domain)
- All repository calls go through interface types, never concrete classes
