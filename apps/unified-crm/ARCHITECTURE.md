# Unified CRM architecture and delivery map

## Verified repository audit (3 November 2026)
- \`favas5291-coder/gym-store\`: React/Vite + Capacitor storefront, protected frontend admin tools, order/payment/support/supplier API clients. References the external commerce API via \`VITE_API_URL\`.
- \`favas5291-coder/gym-drobe-backend\`: separate Express 5 + Mongoose service; \`middleware/authMiddleware.js\` implements JWT customer/admin protection. Routes include \`/api/admin/dashboard\`, \`/api/orders/admin/orders\`, \`/api/support/admin/tickets\`, suppliers, products and shipping. **Do not recreate Razorpay or mutation logic in CRM.**
- \`favas5291-coder/portfolio\`: React/Vite static portfolio. \`src/enquiries/form.js\` submits to configured Formspree, else generates WhatsApp handoff. No first-party lead backend.

## Boundaries
\`\`\`
CRM owner browser
    | same-origin HTTPS + HttpOnly session
CRM web/server (this separate deployable app)
    |--> isolated CRM MongoDB (Fazhere leads, future tasks/deals/AI audits)
    |--> secured server-to-server read-only GymDrobe integration [NOT CONNECTED]
    |--> verified Fazhere form webhook / authorized Gmail [NOT CONNECTED]
    |--> workflow queue and human approvals [NOT IMPLEMENTED]
GymDrobe backend/database remains authoritative for customer, order, payment,
inventory, supplier, coupon and return information.
\`\`\`
Never place shared admin secrets in a frontend bundle. Use per-business permissions and deny-by-default integrations; the owner may aggregate views, but data remains separated by workspace.

## Database schema, now
**CrmLead**: \`_id, workspace='fazhere', name, company, email, emailNormalized (private), phone, country, service, budget, source, sourceReference, stage, notes, currency, estimatedValueMinor, nextFollowupAt, revision, history[], createdAt, updatedAt\`.

\`history[]\` stores \`kind, actor, fields, at\`; this is an initial record history, not yet a tamper-evident financial-grade audit log. Indexes: workspace+update time; workspace+stage; workspace+follow-up time; unique nonblank email normalized per workspace.

## Proposed schema, later (not implemented)
- **CrmAccount / CrmMembership**: identity, role, workspace permissions, security status, MFA.
- **CrmContact**: external references, verified identities, source, consent ledger; dedup and merge.
- **CrmDeal**: contact, pipeline stage, probability, currency and amount in minor units, owner, history.
- **CrmProject / CrmMilestone / CrmTask**: linked won deal, deliverables, deadlines, responsibility.
- **CrmConversation / CrmTicketReference**: channel, external reference, redacted content, status, assigned agent.
- **CrmSupplierReference / CrmOrderReference**: limited external references only; commerce remains source of truth.
- **CrmAutomationRule / CrmAutomationRun / CrmApproval**: permissions, idempotency key, status, attempt count, approvals and immutable logs.
- **CrmConsent / CrmIntegration / CrmAuditEvent**: contact preferences, encrypted credentials reference, redacted audit events. No secrets stored in plain text.

## Complete feature checklist
| Area | Current | Next dependency |
|---|---|---|
| Owner login/session | Implemented | MFA, security review |
| Global summary / live Fazhere lead metrics | Implemented | GymDrobe read-only connector |
| Fazhere lead create/search/pipeline/edit | Implemented | Contact/deal separation, import dedup |
| Deals/proposals/projects/contracts/invoices | Not implemented | Validated documents and billing rules |
| GymDrobe customer/order/supplier/support views | Not connected | Backend read-only auth and contract tests |
| Inventory, fulfillment, returns | Not connected | Verified backend endpoint mapping |
| Shared tasks/calendar/inbox | Not implemented | Authorized Gmail/Calendar/WhatsApp APIs |
| AI bots and workflow execution | Disabled | Knowledge grounding, queue, human approvals |
| Revenue, margin, campaign, conversion analytics | Not connected | Actual paid orders, refunds, costs, marketing events |
| Consent, deletion, export and backups | Partial planning | Legal/privacy review, durable jobs |
| Mobile / accessibility | Responsive React foundation | Device and assistive-tech validation |

## Integration steps
1. **GymDrobe**: create a dedicated, audited read-only service identity or scoped backend route; verify tenant authorization and field minimization. Never reuse the storefront customer's or admin's browser token. Pull only necessary order/customer/supplier summaries over TLS. Keep payment processing exclusively in GymDrobe.
2. **Fazhere enquiries**: confirm Formspree ownership and supported webhook authentication. Receive signed/verified events, map existing form fields, use event IDs for idempotency, and quarantine duplicates. WhatsApp handoffs cannot be assumed to have been sent.
3. **Communications**: Gmail and WhatsApp Business official authorization with scoped access; connect inbox before outbound automations. Respect permission, unsubscribe and rate limits.
4. **Automation**: add durable queue, retries, idempotency keys, structured AI context, per-action permissions, approval queue and emergency stop. Refunds, money, contracts and high-impact messages always need a human.
5. **Reports**: calculate paid sales, outstanding invoice values, estimated deals and expenses separately. Do not convert currencies without explicit rates and dates.

## Order of implementation
1. Secure CRM foundation and Fazhere leads **(first module on feature branch)**.
2. Database-backed contacts/deals/activities + independent audit/event log, tests and backups.
3. Dedicated GymDrobe read-only connector with customer/order/support summaries and field-level checks.
4. Verified Formspree/Gmail lead capture, shared tasks and approval-based outreach drafts.
5. Projects, billing/invoice views, supplier/customer support workflows.
6. Bot workflows and durable worker queue with permissions and emergency stop.
7. Financial reporting, exports, penetration testing and production deployment.

## Acceptance gates
Build/tests must pass; owner session must not leak; cross-workspace data access must be denied; real finances must reconcile with source; duplicate lead creation must return conflict; failed/stale lead update must not overwrite newer edits; no outbound AI action happens without explicit permission. Nothing may modify live order/checkout/payment paths from this feature branch.
