# CLAUDE.md — Canteen Management System

## What this is
A canteen management system with two separate areas:
1. **Public student menu** — read-only, no auth, mobile-friendly. Students browse categories/items/prices/availability only.
2. **Authenticated management system** — OWNER and CASHIER roles (extensible). Sales recording, menu management, inventory, suppliers, reports, dashboard.

## Hard scope restrictions (do not implement without explicit request)
- No student auth/accounts, no customer ordering, no cart, no payments/gateway, no receipts/invoices.
- No order status, kitchen workflow, delivery/pickup, loyalty, coupons.
- No recipe/BOM/ingredient-consumption engine — inventory is explicit (manual add/reduce/adjust), never auto-deducted.
- No GST/tax/complex accounting.
- Sale records: menu item ref + name/price *snapshot*, qty, line total, total, timestamp, created-by user. No customer name/phone/table/payment mode.

## Architecture
- Monorepo via npm workspaces: `client/` (Vite + React + TS strict + React Router v7) and `server/` (Node + Express + TS strict + Mongoose).
- Backend: modular by domain under `server/src/modules/<domain>` (model + validation + controller + service + routes + types together).
- Auth: JWT in HTTP-only secure cookie (never localStorage). Role middleware (`requireAuth`, `requireRole`) enforced server-side — frontend route guards are UX only, never the security boundary.
- Validation: Zod on all mutating endpoints.
- DB: MongoDB/Mongoose. No unnecessary relationships.

## Conventions
- Strict TypeScript everywhere; avoid `any`.
- ESLint + Prettier must pass.
- Minimize dependencies; don't add packages not needed for the stated requirements.
- No secrets committed; `.env.example` kept current; real `.env` gitignored.
- Centralized Express error handler; never leak stack traces/secrets in responses.

## Commands
- `npm run dev` (root) — runs client + server concurrently.
- `npm run build` — builds both workspaces.
- `npm run lint` / `npm run typecheck` / `npm test` — run across workspaces.

## Local env
- Mongo connection via `MONGODB_URI` (server/.env).
- JWT secret via `JWT_SECRET` (server/.env) — never hard-code.
