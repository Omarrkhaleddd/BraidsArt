# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This project is a full-stack **Braids Center Booking System** called "Braids by Design."

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS (artifact: `braids-booking`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

- **Frontend** (`artifacts/braids-booking/`) — React + Vite app at root `/`. Customer-facing booking flow + admin panel.
- **API Server** (`artifacts/api-server/`) — Express REST API at `/api`. Handles all CRUD for designs, availability, bookings, and admin.
- **DB Schema** (`lib/db/src/schema/`) — Three tables: `designs`, `availability`, `bookings`.
- **API Spec** (`lib/api-spec/openapi.yaml`) — OpenAPI 3.1 spec, source of truth for all API contracts.
- **Generated client** (`lib/api-client-react/`) — React Query hooks generated from the spec.

## Features

- **Customer**: Browse braid design gallery, select design, pick date, pick valid time slot, confirm booking
- **Booking logic**: Smart slot calculation based on duration + existing bookings. Prevents overlaps.
- **Admin panel** (`/admin`): Dashboard with stats, manage designs (CRUD), set availability ranges per date, view/cancel bookings

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
