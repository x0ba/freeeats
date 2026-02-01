# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FreeEats is a full-stack web application that helps college students find and share free food locations on their campuses. It's a crowdsourced platform built with Next.js, Convex, and Clerk.

## Technology Stack

- **Frontend**: Next.js 16 (React 19), TypeScript, Tailwind CSS 4
- **Backend**: Convex (serverless backend with real-time database)
- **Authentication**: Clerk
- **UI Components**: Radix UI primitives + shadcn/ui
- **Maps**: Leaflet with React-Leaflet

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (runs frontend + backend in parallel, seeds database)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Seed/reseed campus data
npm run db:seed
npm run db:reseed
```

## Architecture

### Frontend (Next.js App Router)

- **Route structure**: Uses Next.js App Router with file-based routing in `app/`
- **Main entry**: `app/page.tsx` contains the main map/feed view and landing page
- **Components**: React components in `components/`, with shadcn/ui components in `components/ui/`
- **Styling**: Tailwind CSS v4 with custom coral color theme defined in `globals.css`
- **Path aliases**: `@/` maps to the root directory

### Backend (Convex)

Convex uses file-based routing where files in `convex/` map to API endpoints:

- **Schema**: `convex/schema.ts` defines the database schema with indexes
- **Functions**: Individual files export query/mutation/action functions
- **Generated code**: `convex/_generated/` is auto-generated and should not be edited

**Key Convex patterns:**
- Always use the new function syntax with explicit `args` and `returns` validators
- Use `query`/`mutation`/`action` for public functions
- Use `internalQuery`/`internalMutation`/`internalAction` for private functions
- Use `v.null()` as the return validator for functions that don't return a value
- Import types like `Id<'tableName'>` from `./_generated/dataModel` for type-safe IDs

### Database Schema

**Collections:**
- `campuses` - 380+ US universities with name, city, state, lat/long
- `users` - Linked to Clerk auth, profile data, campus association
- `foodPosts` - Food postings with location, type, dietary tags, expiration
- `notifications` - User notifications for food reports/expiration

## Environment Variables

Required environment variables:
- `CONVEX_DEPLOYMENT` - Convex deployment identifier
- `NEXT_PUBLIC_CONVEX_URL` - Convex client URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` - For AI spam filtering

## Cursor Rules

The project includes comprehensive Convex guidelines in `.cursor/rules/convex_rules.mdc`. Key points:

- Always include argument and return validators for all Convex functions
- Do NOT use `filter` in queries; define indexes and use `withIndex` instead
- Actions don't have access to `ctx.db` - use `runQuery`/`runMutation` instead
- Use `ctx.db.replace` to fully replace documents, `ctx.db.patch` for partial updates
- Use `v.int64()` instead of the deprecated `v.bigint()`
