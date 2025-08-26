# requirements.md — G2G-like Marketplace (MVP)

Source context: summarized from the uploaded PRD for a G2G.com clone :contentReference[oaicite:0]{index=0}

## 1. Goals & Scope
Build an MVP for a digital gaming marketplace enabling buyers to discover and purchase in-game currency, items, services, and gift cards; and enabling sellers to list, fulfill, and get paid. Emphasis on trust (ratings, chats, disputes), smooth checkout, and operational visibility.

## 2. Stakeholders
- Buyers, Sellers, Support Agents, Risk/Fraud Analysts, Admin/Operations, Finance.

## 3. Non-Functional Requirements (NFRs)
- **NFR-1 Performance:** P95 page TTFB ≤ 600ms; search results ≤ 800ms; checkout API ≤ 1s.
- **NFR-2 Availability:** 99.9% monthly for buyer-facing flows; graceful degradation on third-party failures.
- **NFR-3 Security:** OWASP ASVS L2; MFA optional; KYC for sellers; data at rest & in transit encrypted; least privilege.
- **NFR-4 Privacy/Compliance:** GDPR/CCPA-ready; data minimization; right-to-delete within 30 days.
- **NFR-5 Observability:** Tracing + metrics + structured logs; error budgets; audit logs for PII and funds flows.
- **NFR-6 Reliability/Integrity:** Idempotent checkout & payouts; exactly-once order creation; retry policies.
- **NFR-7 Cost:** Keep cloud spend <$X/month for MVP; favor managed services; batch notifications.
- **NFR-8 Scalability:** 10k DAU baseline, burst to 100k search/day without re-architecture.
- **NFR-9 Accessibility:** WCAG 2.1 AA key journeys.
- **NFR-10 Localization:** i18n-ready; minimum EN; structure for adding AR later.

## 4. Functional Requirements (EARS)

**REQ-1 User Authentication**
- *When* a user registers or signs in, *the system shall* allow email+password and social SSO (Google) with email/phone verification. *(NFR-3, NFR-9)*
  - **Acceptance**: *Given* valid Google account, *when* user consents, *then* account is created and session issued; *and* email verified state stored.

**REQ-2 Profile & Account Management**
- *When* an authenticated user updates profile, *the system shall* allow editing basic info, password, payment methods (buyer), notification prefs. *(NFR-3, NFR-4)*
  - **Acceptance**: *Given* logged-in user, *when* they change password, *then* old sessions are invalidated and audit logged.

**REQ-3 Seller Onboarding & KYC**
- *When* a user applies to sell, *the system shall* collect required identity/KYC data, validate, and mark seller status before listings are enabled. *(NFR-3, NFR-4)*
  - **Acceptance**: *Given* complete KYC, *when* verification passes, *then* seller status becomes “Active” and listing UI enabled.

**REQ-4 Catalog & Categories**
- *When* users browse, *the system shall* present categories (e.g., Games, Gift Cards, Services) and subcategories with SEO-friendly slugs. *(NFR-1, NFR-8)*
  - **Acceptance**: *Given* category with ≥1 active listing, *when* visited, *then* paginated results display with total counts.

**REQ-5 Listings & Offers**
- *When* a seller manages offers, *the system shall* create/modify/archive offers with price, stock/availability, delivery type (instant/manual), and required buyer fields (e.g., game ID). *(NFR-6)*
  - **Acceptance**: *Given* valid payload, *when* listing is created, *then* it appears in search within 1 minute and is versioned.

**REQ-6 Search, Filters, Sort**
- *When* buyers search, *the system shall* search by keyword and facet filters (game, price range, delivery speed, rating) and sort (price, rating, delivery time, relevance). *(NFR-1, NFR-8)*
  - **Acceptance**: *Given* term “gold”, *when* filter “delivery ≤ 1h” applied, *then* only offers tagged ≤1h are returned.

**REQ-7 Product/Offer Detail**
- *When* viewing an offer, *the system shall* show seller rating, delivery SLA, price, quantity selector, required buyer info fields, and “Message Seller”. *(NFR-9)*
  - **Acceptance**: *Given* offer with 4.9⭐, *when* detail is opened, *then* rating, last 5 reviews, and seller response time are visible.

**REQ-8 Cartless Checkout**
- *When* buyer confirms purchase on an offer, *the system shall* validate required fields, compute totals (price+fees+tax), capture payment via PSP, and create an order atomically. *(NFR-6, NFR-3)*
  - **Acceptance**: *Given* approved payment, *when* callback is received, *then* order status becomes “Paid” and buyer sees order confirmation.

**REQ-9 Order Tracking & Delivery**
- *When* an order is paid, *the system shall* track statuses (Paid → In Progress → Delivered → Completed), support buyer confirmation, and evidence upload by seller. *(NFR-6)*
  - **Acceptance**: *Given* seller uploads proof, *when* buyer confirms receipt, *then* order moves to “Completed” and release timer starts.

**REQ-10 Messaging (Buyer↔Seller)**
- *When* buyer or seller needs to coordinate, *the system shall* provide in-thread messaging per order and pre-sale chat from offer detail. *(NFR-5)*
  - **Acceptance**: *Given* an order, *when* a message is sent, *then* the other party receives a notification and message is stored with audit trail.

**REQ-11 Notifications**
- *When* key events occur, *the system shall* send in-app notifications and email (e.g., order updates, messages). *(NFR-7)*
  - **Acceptance**: *Given* status change to “Delivered,” *when* event emitted, *then* buyer receives in-app and email within 60s.

**REQ-12 Ratings & Reviews**
- *When* an order completes, *the system shall* allow buyer to rate seller (1–5) and leave a review once per order; aggregate ratings shown on offers. *(NFR-6)*
  - **Acceptance**: *Given* completed order, *when* buyer submits 1 review, *then* it’s visible and affects seller’s average.

**REQ-13 Disputes & Support Tickets**
- *When* a party raises an issue, *the system shall* create a ticket linked to the order, enable evidence attachments, and route to support with SLA tracking. *(NFR-5, NFR-3)*
  - **Acceptance**: *Given* a dispute, *when* support resolves, *then* status updates and both parties are notified with resolution summary.

**REQ-14 Seller Payouts & Balances**
- *When* an order’s release conditions are met, *the system shall* move funds to seller balance and enable withdrawal via supported payout methods, with fees and limits. *(NFR-6, NFR-3)*
  - **Acceptance**: *Given* balance ≥ min threshold, *when* seller requests payout, *then* payout instruction is created and status tracked.

**REQ-15 Admin/Moderation**
- *When* admins operate the marketplace, *the system shall* provide backoffice to manage users, listings, disputes, fraud flags, and refunds; all actions audited. *(NFR-5, NFR-3)*
  - **Acceptance**: *Given* admin with role “Support,” *when* they view a ticket, *then* PII is masked unless privileged.

## 5. Out of Scope (MVP)
- Complex loyalty/affiliate programs, multi-currency wallets beyond basic PSP support, advanced ad marketplace, native mobile apps (web-first), multi-PSP smart routing, tax remittance automation (manual export).

## 6. Traceability
- Forward links to design: D-1..D-n (to be added)
- Backlinks from tasks: TASK-* mapping (to be added)
