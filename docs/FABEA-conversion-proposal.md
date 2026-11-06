# FABEA — Checkout conversion and Meta Ads diagnostic proposal
Prepared by Fazhere | 6 November 2026 | Client-discussion draft

> Status: **public concept / review only**. No access to FABEA's private codebase, order records, analytics, ad account, payment-provider dashboard or customer conversations has been granted. Do not describe the proposed work below as delivered to FABEA.

## Executive recommendation

**Do not sell a replacement website first.** Demonstrate a self-service, trackable order journey and audit the sources of low-intent conversations before prescribing either a rebuild or a change in Meta Ads objectives.

The reported business problem is too many enquiries and too few confirmed orders. It has at least two different possible sources:
1. **Website checkout handoff.** The supplied screenshots show COD and Prepaid options followed by a button labelled CONTINUE ON WHATSAPP. The message says the order is not confirmed until FABEA replies. This is a verified extra step at the point of purchase.
2. **Meta click-to-message advertising.** FABEA reports messages from advertising, but its campaign objectives and destination settings remain **unverified**. Website checkout work alone will not suppress messages generated directly by a WhatsApp/Instagram DM ad.

A chat with no order is not automatically a fake person. Classify bot/spam, accidental enquiry, price enquiry, genuine product question and abandoned purchase separately before changing targeting.

## Evidence and limits

| Area | Supported observation | Limit |
| --- | --- | --- |
| Checkout | Screenshot shows selected Prepaid and manual WhatsApp handoff to submit an order request | Cannot inspect server-side order creation or payment state |
| Order status | Screenshot says order is unconfirmed until FABEA replies | Cannot establish what back-office processes already exist |
| Product identity | Screenshot shows a product code and a rupee price | No authority to reuse these as the pricing for the concept |
| Fazhere demo | Source on main is a React/Vite sample catalogue with null sample prices, enquiry-copy workflow and browser-saved selections | Not a production commerce backend or functioning online payment system |
| Existing website | Live fetch was unsuccessful during this audit session | Cannot claim a completed mobile, desktop, speed, accessibility or checkout browser audit |
| Meta Ads | Client reports many low-intent conversations | No actual spend, CTR, purchase, conversion or attribution data; no diagnosis of a specific campaign |
| Payment provider | Razorpay is a candidate, not a selected or activated FABEA account | Requires approved KYC, terms, sandbox configuration and verified secure backend |

The separate **Fazhere self-service checkout prototype** is a demonstrator, not a production store:
- Path in this branch: /demos/fabea/#/checkout-preview
- Sample price, delivery cost, COD order, prepaid status and merchant dashboard are explicitly fictional.
- Checkout form never transmits or saves contact/address inputs; sample orders live in React memory and disappear on refresh.
- Prepaid button simulates success; it does not contact Razorpay, take payment, or produce a real purchase.
- No real ad pixel, analytics purchase event, shipping event or customer notification is fired.

## Immediate diagnosis — in priority order

1. **Trace message origins.** Compare direct click-to-WhatsApp ad conversations, Instagram DMs and website checkout handoffs; count each separately.
2. **Determine the canonical order record.** Does FABEA already create an order ID before opening WhatsApp? When is COD accepted? What actually triggers a prepaid payment?
3. **Review business economics.** AOV, gross profit after product cost, shipping, payment fees, COD returns and refunds, margin per fulfilled order. Without margin, cost-per-purchase targets are guesses.
4. **Test real customer journey with permission.** Mobile device, product page, address entry, COD/prepaid selection, failed payment, order acknowledgement, order tracking and admin fulfilment.
5. **Check tracking.** Pixel/dataset, GA4, browser events, CAPI where appropriate, event_id deduplication, and whether Purchase events correspond to true orders.
6. **Evaluate creative relevance.** Do ads show real product, real price, expected delivery/service coverage, and a purchasing CTA? Does the ad destination match the product?
7. **Interview enquiry handling.** Response delay, repetitive questions, confirmation steps and reasons customers abandon.

## Minimum viable website work — only if the existing system lacks these features

**Customer**
- Guest checkout and editable cart.
- Address, delivery-area and phone validation.
- COD order confirmation with order number and clear status.
- Prepaid flow via an activated merchant gateway; backend-created payment order; verified payment signatures and webhooks; idempotent state transitions and reconciliation.
- Success/failure and retry screens; no misleading paid state.
- Order status page with private access.
- Optional WhatsApp support link, not mandatory ordering.

**Merchant**
- Authenticated order list and search; order/payment/fulfilment state separated.
- Stock checks and server-side repricing; admin-only status controls; cancellation/refund paths where applicable.
- Export/reconciliation report; appropriate data retention and user roles.

**Technical acceptance gates**
- Never trust browser-calculated prices.
- Never mark an order paid based only on client redirect.
- Never fulfil duplicate webhook or order submissions twice.
- Require HTTPS, reviewed admin auth, server logs/alerts and documented backup procedures.
- Payment-provider sandbox pass, failed-payment and abandoned-payment tests.
- Actual shipping/COD serviceability and return rules agreed by client.

If their existing technology already supports these safely, prefer targeted checkout changes over a rebuild.

## Meta Ads: management plan, not campaign claims

Before advising new ad spend, request 14–30 days of Ads Manager reports:
- Campaign names, objective, destination (website vs WhatsApp/DM), optimization event, budget, spend, impressions, frequency, CPM, clicks, link CTR, landing-page views, messaging conversations started, attributable checkout initiations, purchases, purchase value and reporting window.
- Source-of-truth orders: accepted prepaid, COD accepted, delivered, cancelled and returned.
- Creative-level breakdown (UGC vs image, angle, CTA, pricing in ad), placements and geography.

**CPM** is cost per thousand impressions, not a conversion strategy by itself. A website Sales campaign is one possible test after real purchase tracking works. Click-to-message campaigns may also optimize to purchases when properly configured and eligible. Do not assume all messaging campaigns are wrong; measure confirmed orders.

Suggested measurement:
| Metric | Definition | Decision |
| --- | --- | --- |
| Enquiry quality rate | qualified product conversations / all enquiries | Indicates message relevance, not sales |
| Checkout conversion | completed genuine order records / checkout starts | Indicates checkout friction |
| Paid purchase CPA | ad spend / verified prepaid purchases | Compare with prepaid contribution margin |
| Accepted order CPA | ad spend / verified accepted COD+prepaid orders | Leading metric, with cancellation risk |
| Delivered-order CPA | ad spend / successfully delivered non-returned orders | Best practical quality check for COD |
| Net contribution | fulfilled revenue - landed product costs - courier/return/shipping - payment fees - ad spend | Determines whether to scale |
| ROAS | attributed sales revenue / ad spend | Useful but not profit |

Do not count clicking WhatsApp or submitting an unpaid, unaccepted enquiry as a Purchase event. For COD, document the precise order acceptance and later cancellation adjustment rules.

### Trial campaign design (subject to Ads Manager audit)

- Small 14-day learning pilot, not a guaranteed performance result.
- One or two actual stocked items with margin and authentic photos; avoid too many ad sets on tiny budgets.
- Validate destination deep links and mobile performance.
- Show true price and shipping/COD rules early enough to reduce price-only enquiries.
- Test genuine creator demonstration versus clear product-only creative; do not claim statistical significance from a handful of sales.
- Pause changes if purchase tracking is broken; prioritize correcting the measurement.
- Only increase budget if profitable fulfilled-order economics and enough conversion volume justify it.

Meta's own business training includes purchase optimization for ads that click to messaging; compare that approach against website-purchase campaigns based on FABEA's verified account and funnel.

## UGC: three testable concepts

**1. What fits? (15–20 s)**
- Hook: "Wondering how much this bag actually holds?"
- Shots: Real creator and actual physical bag; front, side, open, place everyday items, shoulder carry.
- Script: "Here's how it looks in real life, what fits inside, and how it sits on the shoulder." Add only accurate confirmed features.
- CTA: "See the exact bag, price and delivery options."
- Hypothesis: honest dimension and capacity demonstration reduces sizing questions.

**2. One bag, three looks (15–25 s)**
- Hook: "Can one bag work for three outfits?"
- Shots: Three original styled outfits with same actual product; on-body closeups.
- Script: show genuine styling; avoid unverified quality claims.
- CTA: "Shop the colour shown in the video."
- Hypothesis: lifestyle context improves product understanding and engaged store traffic.

**3. Unboxing and ordering clarity (15–30 s)**
- Hook: "Here's what ordering from FABEA looks like."
- Shots: Real packaging only if approved; actual item detail; verified delivery policy on-screen; clearly disclosed paid creator where required.
- Script: "This is the item, this is the price, and here's how to order directly on the site."
- CTA: "Open the product page to choose COD or prepaid."
- Hypothesis: transparent purchase process reduces repetitive support messages.

Use only real products and authorised footage. Paid creator costs and reuse rights must be agreed separately.

## First seven days — conditioned on access

| Day | Focus | Evidence of completion |
| --- | --- | --- |
| 1 | Owner interview; access and data request; distinguish message sources | Agreed funnel map, baseline numbers |
| 2 | Checkout walkthrough and technical feasibility | Screenshots, defects and implementation decision |
| 3 | Meta Ads and tracking audit | Event and campaign mapping; no invented figures |
| 4 | Select MVP fixes and prepare prototype review | Approved scope and success criteria |
| 5 | Implement one scoped, reversible fix in staging | Code review and test coverage |
| 6 | Sandbox QA, mobile checkout, admin access tests | Signed checklist, remaining blockers |
| 7 | Client review and next-phase decision | Accepted work and approved launch/change plan |

No production changes until access, approval, staging and rollback plan are available.

## Thirty-day roadmap

- **Week 1:** baseline diagnostic, source split and prioritized technical scope.
- **Week 2:** checkout/order system implementation or targeted patch in staging, with verified server-side events.
- **Week 3:** QA and approved deployment; instrument only genuine order conversions; reconcile early orders.
- **Week 4:** small creative/ad tests with owner-controlled spend; review delivered-order metrics and decide what to continue.

Timing depends on stack, scope, client approvals and available data. A complete backend rebuild may take longer.

## Indicative Fazhere quotation (discussion prices; not a firm offer)

| Service | Proposed fee | Scope |
| --- | --- | --- |
| Initial paid audit | ₹3,000–₹5,000 one-time | Funnel, website, tracking and Meta Ads diagnostic; prioritized action plan |
| Checkout MVP on an existing suitable backend | ₹20,000–₹35,000 one-time | Agreed guest checkout, COD, gateway integration, confirmation and basic merchant workflow |
| Full replacement of unsupported commerce backend | Quote only after technical discovery | Architecture, migration, payments, roles, inventory, testing and deployment |
| Meta Ads management | ₹7,500/month standard; optional ₹6,000 first-month introduction | One account, limited campaigns, weekly review and month-end report |
| 14-day limited management pilot | ₹3,500–₹5,000 | Separate short trial; scope and working budget agreed in writing |
| Edited UGC video | ₹800–₹2,000 per simple edit | Footage supplied; creator/filming/licensing excluded |
| Optional website maintenance | Quote after scope | Security, uptime, hosting changes and support SLA |

These figures are recommended *Fazhere opening prices*, not verified quotes from competitors. Prices, GST where applicable, timelines, acceptance terms and number of revisions must be confirmed in a signed statement of work. Do not promise a checkout system for ₹6,000/month Meta Ads fee.

**Excluded from Fazhere fees:** FABEA-owned ad spend, creator costs, subscriptions, gateway processing fees, server/hosting costs, courier fees, taxes, paid messaging and third-party services. Payment gateway fees are governed by FABEA's selected provider contract; Razorpay publishes standard payment pricing and promotional eligibility subject to account conditions.

Suggested commercial model: diagnostic as a paid entry project; 40% implementation deposit, 40% staging approval, 20% after agreed acceptance; monthly Meta management billed upfront. Adjust after client discussion.

## Handover and approval request

Ask FABEA for:
1. Read-only Ads Manager access/report export for last 30 days and campaign destinations.
2. Order counts by accepted prepaid, accepted COD, delivered, returned and cancelled.
3. Product cost/margin, current ad budget, COD delivery coverage, shipping/return promises.
4. Existing developer/hosting and payment integration details, plus permission for a staging checkout audit.
5. Their monthly budget and whether they prefer an audit-only start or an implementation quote.

**Client-facing opening:**
"Thank you for explaining the difficulty with enquiries not turning into orders. The current checkout appears to ask shoppers to continue on WhatsApp even after selecting a payment type. I'd like to identify whether the biggest losses come from that extra step or from ads that invite low-intent messages. Rather than proposing a new website first, Fazhere can audit the journey and show how customers could complete orders directly, while WhatsApp remains available for support. We can then quote only the changes that are genuinely needed."

## Current work status

- **Completed for review:** source examination of Fazhere FABEA demo; screenshot-based checkout findings; this proposal; independent, in-memory checkout-and-dashboard prototype on a feature branch.
- **Not completed:** live browser audit of FABEA's production site, end-to-end production checkout, actual payment integration, production admin dashboard, Meta campaign audit or launches, client access or acceptance.
- **Verification still required:** local development build and device testing, CI, live preview after PR integration, and all staging payment and security tests.

### External references
- Razorpay pricing: https://razorpay.com/pricing/
- Razorpay security checklist: https://razorpay.com/security/checklist/
- Meta Blueprint course catalogue (campaign objective and conversion settings): https://metaspark.facebookblueprint.com/student/catalog/list?category_ids=7509-optimize-your-campaigns
- Meta Blueprint purchase optimization for click-to-message: https://agencies.facebookblueprint.com/student/page/652744-optimize-for-purchases-with-ads-that-click-to-message
