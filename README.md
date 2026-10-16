<div align="center">

# Total Control

**Multi-tenant SaaS for point of sale (POS) and inventory management.**

🇧🇷 [Leia em português](README.pt-BR.md) — includes the full operations guide

[![CI](https://github.com/vallevinicius/TotalControl/actions/workflows/ci.yml/badge.svg)](https://github.com/vallevinicius/TotalControl/actions/workflows/ci.yml) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-tested-6E9F18?logo=vitest&logoColor=white)

</div>

## About

Total Control lets small retailers run their counter and stock from the browser: sales with split payments, cash register, inventory, customers, sellers, financial entries and reports. Each company can have several stores, and every query is isolated by tenant. A separate platform admin area lets the Total Software team manage companies, plans and subscriptions (Mercado Pago).

## Features

- **POS** with barcode input, split payments (credit card up to 12x, interest from 4x calculated on the server), sales on hold and receipt printing
- **Offline POS**: service worker + IndexedDB catalog; sales are queued on the device and synced in order with an idempotent `idLocal`
- **Cash register** with opening/closing, cash-in and cash-out; cancelling a sale never deletes it, it returns stock and leaves reports
- **Inventory**: categories with custom attributes, adjustments with reason, movement history, transfers between stores, CSV import/export
- **Finance**: payables and receivables with instalments and a simplified income statement
- **Reports**: sales per day, ABC curve, idle stock, PDF printing
- **Team**: e-mail invitations, per-screen permissions and per-action permissions (discount limits, price changes, cancellations)
- **Subscriptions** (Starter/Pro) through Mercado Pago with trial, upgrade, cancellation and `402 ACESSO_EXPIRADO` when access ends
- **E-mail alerts**: trial ending, payment refused, weekly low-stock and overdue-bill summaries
- **LGPD**: export all company data as JSON and delete the account

## Tech stack

| Layer | Technology |
|---|---|
| Front-end | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| API | Express, TypeScript (`tsx`), Zod, Helmet, express-rate-limit |
| Data | MySQL 8 + Prisma (21 models) |
| Auth | JWT access token (30 min) + rotating refresh token (stored hashed), bcrypt, TOTP for platform admins |
| Integrations | Mercado Pago, SMTP (Nodemailer), Cloudflare Turnstile, Sentry (optional) |
| Tests / CI | Vitest + Supertest against a real MySQL in GitHub Actions |

## Architecture

```
src/                        React app
  contexts/TenantContext    active session (tenant + user) resolved from the JWT
  services/apiService.ts    HTTP client
  components/               PDV, Estoque, Financeiro, Relatorios, Admin, ...
server/
  prisma/schema.prisma      data model
  src/routes/               auth, products, categories, customers, sales, stock,
                            dashboard, reports, finance, admin, subscription...
  src/middleware/           auth (store vs. platform tokens), permissions
  src/config/               plans, POS policy, actions
  tests/                    Vitest + Supertest
```

Key design decisions:

1. **Multi-tenancy** – no store data (name, logo, theme, timezone) is hard-coded; it all comes from `TenantContext`.
2. **Data isolation** – every API route requires auth and filters by the `tenantId` from the JWT.
3. **Segment-agnostic catalog** – categories are created per tenant and can carry custom attributes.
4. **Transactions as the backbone** – every stock in/out is a `Transacao` with a price snapshot, payment method, discount and user; dashboards and reports derive from it.
5. **Platform admin is a different identity** – `AdminPlataforma` has no `tenantId` and its own JWT type; store and platform middlewares reject each other's tokens.
6. **Permissions per action** – enforced by `requerirAcao(...)` on the server; the front-end only hides buttons.

## Security

- Permissions read from the database on every request, so changes apply immediately
- Short-lived access token, rotating refresh token stored as a hash; reusing a used refresh token revokes all sessions; password reset bumps `tokenVersion`
- Conditional stock decrement: concurrent sales never make stock negative
- Rate limiting on login, sign-up, 2FA and webhook; CORS restricted to `APP_URL` / `CORS_ORIGINS`; `helmet`
- Self-service sign-up requires e-mail confirmation (single-use, hashed, 24 h link) and Cloudflare Turnstile; unconfirmed accounts are purged after 7 days
- `X-Request-Id` on every request and in 500 responses; health checks at `/api/health` and `/api/health/ready`

## Getting started

**Prerequisites:** Node.js 18+, MySQL 8

```bash
cd server
cp .env.example .env               # set DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_SENHA...
npm install
npx prisma migrate deploy
npx prisma db seed                 # demo store; random admin password printed once
cd ..
npm install
npm run dev:full                   # web http://localhost:3099 · API http://localhost:4000
```

### Environment variables

`server/.env.example` and `.env.example` — never commit real values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` / `ACCESS_TOKEN_TTL` | Token secret and access-token lifetime |
| `ADMIN_EMAIL` / `ADMIN_SENHA` | Platform admin account (created/updated at boot) |
| `APP_URL` / `API_PUBLIC_URL` / `CORS_ORIGINS` / `TRUST_PROXY` | URLs, CORS and proxy settings |
| `MERCADOPAGO_ACCESS_TOKEN` / `MERCADOPAGO_WEBHOOK_SECRET` | Subscription billing |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | E-mail |
| `TURNSTILE_SECRET_KEY` / `VITE_TURNSTILE_SITE_KEY` | Captcha on sign-up (disabled when empty) |
| `SENTRY_DSN` / `LOG_FORMATO` | Error reporting and log format |
| `VITE_API_URL` / `VITE_SITE_URL` | Front-end settings |

### Scripts

| Command | Description |
|---|---|
| `npm run dev:full` | Web + API together |
| `npm run build` / `npm run preview` | Production build of the web app (offline mode only works here) |
| `npm test` | API test suite |
| `npm run verificar` | Full check: type-check + build + API type-check + tests (same as CI) |

## Testing

19 Vitest + Supertest suites run against a real MySQL database, locally and in GitHub Actions on every push and pull request.

## Operations

Backups (`server/scripts/backup-mysql.sh`), restore steps, Mercado Pago setup and the store owner's feature guide are documented in the [Portuguese README](README.pt-BR.md).

## Team

- [Vinicius do Valle](https://github.com/vallevinicius)
