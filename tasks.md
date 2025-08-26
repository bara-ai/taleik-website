# tasks.md — Execution Plan

> Sequential phases with reviews; each task includes outputs, estimate (t-shirt), deps, and trace.

## Phase 0 — Foundations
- **TASK-1 Project scaffold & CI/CD**
  - Outputs: repo, envs (.dev/.stg/.prod), CI (lint/test), CD pipelines.
  - Est: M; Deps: —; Trace: NFR-7, NFR-5.
- **TASK-2 Infra baseline**
  - Outputs: VPC, managed DB, object storage, search cluster, event bus, secrets.
  - Est: M; Deps: T1; Trace: D-0, D-6.

## Phase 1 — Identity & Profiles
- **TASK-3 Auth Service (email/password + Google OAuth)**
  - Outputs: endpoints, JWT sessions, MFA opt-in, tests.
  - Est: M; Deps: T1; Trace: REQ-1, D-2.
- **TASK-4 Profile Service**
  - Outputs: CRUD profile, password change w/ session revoke, audit logs.
  - Est: S; Deps: T3; Trace: REQ-2, D-2.

## Phase 2 — Seller Enablement
- **TASK-5 Seller/KYC**
  - Outputs: KYC intake UI/API, provider sandbox integration, state machine.
  - Est: M; Deps: T3; Trace: REQ-3, D-2.
- **TASK-6 Admin roles & RBAC**
  - Outputs: role model, policy checks, masking of PII.
  - Est: S; Deps: T3; Trace: REQ-15, D-5.

## Phase 3 — Catalog & Listings
- **TASK-7 Catalog & categories**
  - Outputs: CRUD categories, SEO slugs, SSR pages.
  - Est: M; Deps: T1; Trace: REQ-4, D-2.
- **TASK-8 Listing/Offer service**
  - Outputs: CRUD, required_fields schema, stock, delivery SLA.
  - Est: M; Deps: T5; Trace: REQ-5, REQ-7, D-1.

## Phase 4 — Search & Discovery
- **TASK-9 Search integration**
  - Outputs: indexer, query API w/ facets & sorts, relevance tuning basics.
  - Est: M; Deps: T7–T8; Trace: REQ-6, D-0.
- **TASK-10 Home/category UI**
  - Outputs: paginated grids, filters, empty states, a11y checks.
  - Est: S; Deps: T9; Trace: REQ-4, REQ-6.

## Phase 5 — Checkout & Orders
- **TASK-11 Checkout service**
  - Outputs: totals calc (fees/tax placeholders), idempotency, PSP create intent.
  - Est: L; Deps: T8–T9; Trace: REQ-8, NFR-6.
- **TASK-12 PSP webhook & order creation**
  - Outputs: signed webhook handler, order.create, state machine.
  - Est: M; Deps: T11; Trace: REQ-8, REQ-9.
- **TASK-13 Order tracking UI**
  - Outputs: order detail page, status timeline, proof uploads.
  - Est: M; Deps: T12; Trace: REQ-9.

## Phase 6 — Messaging & Notifications
- **TASK-14 Messaging**
  - Outputs: order-thread and pre-sale chat APIs/UI, rate limits.
  - Est: M; Deps: T3, T12; Trace: REQ-10, D-2.
- **TASK-15 Notification service**
  - Outputs: in-app + email templates, queue workers, event subscriptions.
  - Est: S; Deps: T12; Trace: REQ-11, D-6.

## Phase 7 — Trust & Safety
- **TASK-16 Reviews**
  - Outputs: one-per-order constraint, aggregates, display on offers.
  - Est: S; Deps: T13; Trace: REQ-12.
- **TASK-17 Disputes/Tickets**
  - Outputs: ticket model, SLA timers, attachments, admin views.
  - Est: M; Deps: T13, T6; Trace: REQ-13, REQ-15.
- **TASK-18 Fraud/risk basics**
  - Outputs: velocity checks, manual review queue, flags in admin.
  - Est: S; Deps: T12; Trace: NFR-3, D-8.

## Phase 8 — Payouts & Finance
- **TASK-19 Balance ledger**
  - Outputs: double-entry ledger, release timers, balance API.
  - Est: M; Deps: T12; Trace: REQ-14, NFR-6.
- **TASK-20 Payouts**
  - Outputs: withdrawal request, PSP payout integration, status tracking.
  - Est: M; Deps: T19; Trace: REQ-14.

## Phase 9 — Ops, QA, and Hardening
- **TASK-21 Observability & audits**
  - Outputs: traces, metrics, dashboards, audit logs & retention policies.
  - Est: S; Deps: T1–T20; Trace: NFR-5, D-6.
- **TASK-22 Security hardening**
  - Outputs: threat model, authZ tests, CSP, input validation, malware scan.
  - Est: S; Deps: T3, T14, T17; Trace: NFR-3, D-5.
- **TASK-23 Performance & load testing**
  - Outputs: load test scripts, P95 verification, search/checkout tuning.
  - Est: S; Deps: T9, T11; Trace: NFR-1, NFR-8.
- **TASK-24 A11y & UX QA**
  - Outputs: WCAG AA checks on key flows; fix list.
  - Est: XS; Deps: UI tasks; Trace: NFR-9.
- **TASK-25 DR/Backup & runbooks**
  - Outputs: backups, RPO/RTO docs, incident runbooks, on-call rotation.
  - Est: S; Deps: T2; Trace: NFR-2, NFR-5.

## Deliverables per Task
- Code PRs with unit/integration tests, API contracts (OpenAPI), and short README.
- Test evidence: functional scenarios (Given/When/Then) mapped to REQ-*.
- Operational docs: dashboards links, alerts, runbooks where applicable.
