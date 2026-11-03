# Unified CRM · GymDrobe + Fazhere

A separately deployable CRM foundation in the existing portfolio repository. **The root portfolio application is unchanged.** This service is not connected to the live GymDrobe API, Formspree, Gmail or payment systems yet.

## What is working in this codebase

- React owner interface: Overview, Fazhere leads, GymDrobe connection status, AI control status.
- Owner login with a bcrypt password hash and 6-hour signed, HttpOnly, SameSite=Strict session cookie.
- MongoDB persistent Fazhere leads with pipeline stages, search, pagination, revisions, follow-up dates, and embedded activity history.
- Per-route authentication, request-origin checks on writes, duplicate email prevention, input validation and user-safe errors.
- Summary metrics derived from the actual CRM leads. Unconnected financial and commerce numbers are **null**, not estimated.
- Manual lead creation, status updates and notes/follow-up edits. No automated outbound communication.

## Local setup (Node 22+, MongoDB)

From this directory:

1. Run \`npm install\`.
2. Copy \`.env.example\` to \`.env\` and fill all required values. Never commit \`.env\`.
3. Generate a secure bcrypt password hash:
   \`node -e "require('bcryptjs').hash('YOUR_LONG_PASSWORD',12).then(console.log)"\`
4. Generate a session secret:
   \`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"\`
5. Run \`npm start\` (API on localhost:4100).
6. In another terminal run \`npx vite --host localhost\` (UI on localhost:5175).
7. Run \`npm test\` and \`npm run build\` before deployment.

For production, set \`NODE_ENV=production\` and \`CRM_ORIGIN\` to your dedicated HTTPS CRM origin. Install and build the standalone application independently of the portfolio root, then serve \`dist/\` with \`npm start\`. Use a private MongoDB database dedicated to CRM data, TLS, backups, WAF-based login rate limiting, alerting, and a protected deployment account.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | Service readiness |
| POST | /api/auth/login | Owner login |
| POST | /api/auth/logout | Clear private session |
| GET | /api/auth/me | Current owner |
| GET | /api/overview | Real lead metrics; unconnected sources marked |
| GET | /api/leads | Paginated Fazhere lead listing |
| POST | /api/leads | Create verified/manual lead |
| GET | /api/leads/:id | Lead and activity history |
| PATCH | /api/leads/:id | Optimistic revision checked update |

Write requests require the correct \`Origin\` and \`X-CRM-Action: 1\`. Browser requests use same-origin cookies.

## Current limitations and pending work

This is a **first working module**, not a complete production CRM. Before live rollout: configure a real database and secure host, execute end-to-end authentication and database tests, enable centralized rate limiting and monitoring, define retention/deletion policies, evaluate MFA, use durable immutable audit events, configure backups, and validate international privacy and communication rules.

GymDrobe integration must be server-to-server with independently provisioned least-privileged credentials; never expose GymDrobe admin JWTs to Fazhere or CRM browser code. Portfolio enquiries currently use Formspree or WhatsApp; route them into CRM only after an authenticated webhook or official integration is configured, tested and verified. Outbound email and AI actions remain disabled pending permission and approval workflows.

See [CRM architecture](./ARCHITECTURE.md) for models, source of truth, integration boundaries and staged delivery.

**Important:** Do not merge into the default branch or deploy to a public URL without reviewing the security and credentials checklist.
