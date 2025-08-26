# design.md — Architecture & Decisions

## D-0 Overview
Microservice-lean modular architecture (could be a well-structured monolith + modular services for PSP/KYC) deployed on managed cloud. Event-driven backbone for orders and notifications. Strong boundaries for payments, identity, and messaging.

### Components
- **Web App (Next.js or similar)**: SSR/ISR for SEO categories; i18n-ready; Auth.
- **API Gateway**: AuthN/Z, request shaping, rate limits.
- **Services:**
  - **Auth Service**: Email/password, Google OAuth, session/JWT, MFA. (REQ-1)
  - **User/Profile Service**: Profiles, payment methods (tokenized), prefs. (REQ-2)
  - **Seller/KYC Service**: KYC intake, provider integration, status. (REQ-3)
  - **Catalog Service**: Categories, SEO slugs, facets. (REQ-4)
  - **Listing/Offer Service**: CRUD, availability, delivery types, required fields schema. (REQ-5, REQ-7)
  - **Search Service**: Inverted index (managed search, e.g., OpenSearch/Algolia) for keyword + facets + sort. (REQ-6)
  - **Checkout Service**: Pricing, fees, taxes, PSP integration, idempotent order creation. (REQ-8)
  - **Order Service**: State machine, timers (delivery/release), proofs, attachments. (REQ-9)
  - **Messaging Service**: Order-thread and pre-sale chat, notifications fan-out. (REQ-10)
  - **Notification Service**: In-app + email dispatch (queue-backed). (REQ-11)
  - **Review Service**: Ratings, one-review-per-order constraint, aggregates. (REQ-12)
  - **Support/Dispute Service**: Tickets, SLAs, attachments, routing/roles. (REQ-13, REQ-15)
  - **Payouts/Balance Service**: Ledgered balances, withdrawal flows, PSP payout API. (REQ-14)
  - **Admin/Backoffice**: RBAC, masking, case tools. (REQ-15)
- **Shared:**
  - **Event Bus** (e.g., SNS/SQS or Pub/Sub): `order.created`, `order.delivered`, `message.sent`, `review.created`, `payout.requested`.
  - **Object Storage**: Evidence/attachments, proofs (virus scan).
  - **Relational DB**: Core entities; **Search Index**: listings/offers; **Cache**: hot offers, session.

## D-1 Data Model (key entities)
- `User(id, email, phone, roles[], mfa_enabled, status)`
- `Seller(user_id, kyc_status, rating_avg, rating_count, payout_methods[])`
- `Category(id, name, slug, parent_id)`
- `Listing(id, seller_id, category_id, title, description, delivery_type, required_fields_schema, status)`
- `Offer(id, listing_id, price, currency, stock, min_qty, max_qty, delivery_sla_min, delivery_sla_max, is_active)`
- `Order(id, buyer_id, offer_id, qty, price_total, fees, tax, status, required_fields_payload, delivered_at, completed_at)`
- `Message(id, thread_id, sender_id, order_id?, body, created_at)`
- `Review(order_id, rating, text, created_at, visible)`
- `Ticket(id, order_id, type, status, assigned_to, sla_due_at)`
- `LedgerEntry(id, seller_id, order_id?, type, amount, balance_after)`
- `Payout(id, seller_id, amount, method, status)`

## D-2 APIs (selected)
- `POST /auth/signin`, `POST /auth/oauth/google`, `POST /auth/register`
- `GET/PUT /me/profile`
- `POST /seller/apply`, `GET /seller/status`
- `GET /categories`, `GET /categories/{slug}`
- `POST/PUT/PATCH /listings`, `POST/PUT /offers`
- `GET /search?q&facets&sort`
- `POST /checkout/confirm` (idempotency-key) → creates PaymentIntent, on PSP success → `orders.create`
- `GET /orders/{id}`, `POST /orders/{id}/deliver`, `POST /orders/{id}/confirm`
- `POST /orders/{id}/messages`, `POST /messages/presale`
- `POST /reviews`
- `POST /tickets`, `PATCH /tickets/{id}`
- `GET /balance`, `POST /payouts`
- Admin-prefixed endpoints with RBAC and audit.

## D-3 Key Sequences (happy paths)
**Search → Offer → Checkout**
1. Buyer searches via `GET /search`.
2. Opens offer detail; front-end fetches seller rating + recent reviews.
3. Buyer submits checkout: payload includes required fields; Checkout Service verifies offer stock, computes totals, calls PSP.
4. PSP approves → webhook hits Gateway → Checkout validates signature → emits `order.created` to Order Service.
5. Order Service sets status `Paid`; Notification Service informs buyer & seller.

**Delivery & Completion**
1. Seller marks delivered, uploads proof → Order Service records `Delivered`.
2. Buyer confirms → Order `Completed`; Payouts Service schedules release to seller balance after hold period.
3. Review Service allows single review; Search aggregates rating into offer index.

**Dispute**
1. Buyer opens ticket from order; Support Service creates case, SLA timers.
2. Agent reviews evidence; decision updates order and (if needed) triggers refund flow via PSP.

## D-4 Error Handling & Resilience
- Idempotency keys on checkout & webhooks (NFR-6).
- PSP/KYC retries: exponential backoff, DLQ after N attempts.
- Circuit breakers around PSP/KYC/Search.
- Partial outages: read-only catalog if DB degraded; queue notifications when email provider down (NFR-2).

## D-5 Security & Privacy
- OAuth/OIDC for Google; salted hash for passwords; MFA optional (TOTP/SMS). (NFR-3)
- PII encryption (field-level for phone/email); tokenized payment methods via PSP (no PAN storage).
- RBAC: roles `buyer`, `seller`, `support`, `admin`, `risk`.
- Data retention: messages & tickets 24 months, reviews indefinite, PII purge on account deletion within 30 days. (NFR-4)
- Attachment malware scanning; signed URLs with short TTL.

## D-6 Observability & Ops
- OpenTelemetry tracing across gateway/services; correlation IDs from front-end. (NFR-5)
- Metrics: latency, error rate, checkout conversions, dispute rates, delivery SLA adherence.
- Audit logs for admin/support actions; access to PII masked by default.

## D-7 Performance & Cost
- SSR for categories/product pages; edge caching for static assets; CDN for media. (NFR-1, NFR-7)
- Search index denormalized for hot facets; cache hot offers w/ TTL 60s.
- Batch notification sends; cold queues outside peak.

## D-8 Risks & Mitigations
- **Fraud/chargebacks:** 3DS/SCA where available; velocity checks; manual review queue.
- **Abuse/spam messaging:** rate limit, content filtering, sender reputation.
- **Misdelivery disputes:** mandatory proof-of-delivery, escrowed funds, timers.
- **Vendor lock-in (PSP/search):** abstracted interfaces; feature flags to switch providers.

## D-9 Satisfying Requirements
- REQ-1→Auth; REQ-2→User; REQ-3→Seller/KYC; REQ-4→Catalog; REQ-5→Listing/Offer; REQ-6→Search; REQ-7→Listing/Offer + Review;
- REQ-8→Checkout + Order; REQ-9→Order; REQ-10→Messaging; REQ-11→Notification; REQ-12→Review; REQ-13→Support; REQ-14→Payouts; REQ-15→Admin.

## D-10 Assumptions (impact noted)
- Single PSP for MVP; manual tax configuration per region (limits automated compliance). (REQ-8, REQ-14)
- Email only + in-app notifications (no SMS) to control cost. (REQ-11, NFR-7)
- Web-first responsive UI; mobile apps deferred. (NFR-8)
