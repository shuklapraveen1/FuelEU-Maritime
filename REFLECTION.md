# REFLECTION.md

## Engineering Reflections

### What Went Well

#### Domain Isolation
The most valuable architectural decision was keeping the domain layer completely free of framework dependencies. The three core domain services — `ComplianceCalculator`, `BankingService`, and `PoolingAlgorithm` — are pure TypeScript classes with no imports beyond their own domain types. This makes them:

- **Fast to test** — no database setup, no mocking, no async
- **Easy to reason about** — the compliance formulas are self-documenting
- **Portable** — could be extracted to a shared library used by both backend and frontend

#### Hexagonal Architecture
The ports-and-adapters pattern paid off when implementing the database layer. Because the application layer depends only on `IRouteRepository` and `IComplianceRepository` interfaces, swapping the PostgreSQL/Prisma implementation for an in-memory implementation for unit testing would require zero changes to the application or domain layers.

#### Zod Validation at the Boundary
Validating all inbound HTTP requests with Zod at the controller level (before they reach use cases) meant that use cases and domain services could assume their inputs were already valid. This follows the principle that **validation is an adapter concern, not a domain concern**.

---

### Challenges

#### Pooling Algorithm Complexity
The Article 21 pooling algorithm has several subtle constraints:
1. The pool sum must be ≥ 0
2. Deficit ships cannot exit worse than they entered
3. Surplus ships cannot exit with negative CB

Getting constraint 3 right required careful ordering of transfers (surplus ships sorted first) and capping each transfer to the available surplus. The algorithm is O(n²) in the worst case but this is acceptable given pools are limited to a small number of ships in practice.

#### Floating-Point Precision
The compliance balance formula multiplies GHG intensity differences by energy values in the order of 200 million MJ. Small floating-point rounding errors accumulate. The solution was:
- Using `toBeCloseTo` in tests rather than exact equality
- Rounding display values to appropriate significant figures in the frontend
- Not storing rounded values in the database (store raw floats, round at display time)

#### Prisma Transaction for Baseline
Setting a new baseline route required clearing all existing baselines first. A naive implementation could create a race condition where two simultaneous requests both clear baselines and both try to set their own. This was solved using a `prisma.$transaction` to make the clear-and-set operation atomic.

---

### What Could Be Improved

#### Event Sourcing for Compliance History
The current model stores the latest compliance balance as a mutable record. A production system should use **event sourcing** — recording every compliance event (route logged, surplus banked, pool formed) as an immutable event, and deriving current state by replaying events. This would provide:
- Full audit trail required by regulators
- Ability to reconstruct state at any point in time
- No mutable `cbGco2eq` field that can be corrupted

#### CQRS for Compliance Queries
The compliance query model (`GET /compliance/cb`) currently joins and aggregates data in real time. For large fleets with thousands of ships, pre-computed read models (CQRS projections) would dramatically improve query performance.

#### Authentication & Multi-Tenancy
The current implementation has no authentication. A production system would need:
- JWT/OAuth2 authentication
- Organisation-level multi-tenancy (each shipping company sees only their routes)
- Role-based access control (read-only compliance officer vs. operator who can set baselines)

#### Rate Limiting & Idempotency
The banking and pooling endpoints are not idempotent. Clicking "Bank" twice would bank the surplus twice (the second call would fail with a 422, but only because the available CB would be 0). A better design would:
- Accept an idempotency key in the request header
- Store processed requests in a deduplification table

#### Frontend Error Boundaries
The React application has toast notifications for API errors but no React Error Boundaries to catch unexpected rendering errors. Adding boundaries around each tab page would prevent one tab's crash from taking down the entire dashboard.

#### WebSocket for Real-Time Updates
In a multi-user environment, if operator A banks surplus while operator B is viewing the banking tab, operator B's view will be stale until they refresh. WebSocket push notifications (or Server-Sent Events) would allow real-time updates across connected clients.

---

### Compliance Domain Learnings

#### FuelEU Regulation Structure
- **Article 4** defines the GHG intensity target and compliance balance formula
- **Article 20** (Banking) is straightforward — surplus can be carried forward one year
- **Article 21** (Pooling) is the most complex — it requires a multi-party agreement and has strict transfer constraints to prevent gaming

#### Target Intensity Trajectory
The 89.3368 gCO₂eq/MJ target is the 2025 baseline. The regulation tightens every 5 years:
- 2025: −2% (89.3368)
- 2030: −6%
- 2035: −14.5%
- 2040: −31%
- 2045: −62%
- 2050: −80%

A production system should store the target trajectory as a lookup table and apply the correct target based on the reporting year, rather than hardcoding 89.3368.

---

### Summary

The FuelEU Maritime Compliance Platform demonstrates how hexagonal architecture enables clean separation of the volatile regulatory business logic from the equally-volatile infrastructure choices. The domain layer represents the stable core — the compliance formulas are defined by EU law and change only when the regulation is amended. Everything else (database, HTTP framework, UI library) is replaceable without touching the domain.
