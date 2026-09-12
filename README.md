# CineBook

Production-ready cinema ticket booking app built with Next.js App Router, TypeScript, Tailwind CSS, Neon PostgreSQL, Drizzle ORM, NextAuth, and Stripe test payments.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS
- Neon serverless PostgreSQL
- Drizzle ORM + SQL migrations
- NextAuth credentials authentication
- Stripe Checkout in test mode
- Node.js route handlers

## Features

- Search and filter movies by title, genre, language, cinema, and date
- Movie, cinema, showtime, seat map, checkout, ticket, history, login, and admin pages
- Live seat state model with AVAILABLE, HELD, BOOKED, BLOCKED
- Transaction-safe booking holds with idempotency key support
- Payment status tracked separately from booking status
- QR-coded digital tickets
- Booking cancellation eligibility checks
- Idempotent expired-hold cleanup endpoint protected by CRON secret

## Environment Variables

Copy .env.example to .env.local and configure:

- DATABASE_URL: Pooled Neon URL for app runtime queries
- DATABASE_URL_MIGRATION: Migration URL (can be direct or privileged URL)
- NEXTAUTH_SECRET: Random secure secret for auth signing
- NEXTAUTH_URL: App base URL (http://localhost:3000 for local)
- STRIPE_SECRET_KEY: Stripe test secret key
- STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret
- CRON_SECRET: Secret token for scheduled cleanup endpoint

## Local Setup

1. Install dependencies:
   npm install
2. Generate migrations (if schema changed):
   npm run db:generate
3. Apply migrations:
   npm run db:migrate
4. Seed sample data:
   npm run db:seed
5. Run dev server:
   npm run dev

Seeded credentials:

- Admin: admin@cinebook.dev / Admin123!
- User: user@cinebook.dev / User123!

## Database Rules Implemented

- UUID primary keys across all tables
- UTC-capable timestamp with time zone columns
- Money stored in integer minor units
- Foreign keys, indexes, and unique constraints
- Unique cinema screen names per cinema (auditoriums)
- Unique seat positions per auditorium (row + seat number)
- Unique showtime seat per showtime and unique booking_items.showtime_seat_id to prevent double booking
- Separate booking status and payment status enums

## Booking Transaction Flow

createPendingBooking in src/lib/booking.ts:

1. Begin transaction
2. Lock requested showtime_seat rows
3. Validate seat availability
4. Apply seat holds with expiration
5. Compute pricing server-side
6. Insert pending booking + booking items + pending payment
7. Commit transaction
8. Confirm seats only after verified Stripe webhook payment
9. Enforce idempotency with bookings.idempotency_key
10. Reject seats that became unavailable

## API Endpoints

- POST /api/bookings/hold
- POST /api/payments/checkout
- POST /api/payments/webhook
- POST /api/cron/release-seat-holds

Cron endpoint auth:

Authorization: Bearer <CRON_SECRET>

Example manual invocation:

curl -X POST https://your-deployment-url/api/cron/release-seat-holds -H "Authorization: Bearer $CRON_SECRET"
## Testing

Quick automated tests:

- npm test
- npm run test:race (requires configured Neon DB with migrations + seed)

Manual QA checklist:

- tests/qa-checklist.md

Critical scenarios include:

- Auth flow and authorization boundaries
- Double-booking race from two sessions
- Hold expiration and cleanup idempotency
- Stripe success/failure/cancel/retry webhook handling

## Non-Vercel Deployment

This project is deployed as a standard Next.js Node application. A Dockerfile is included so it can run on hosts such as Render, Railway, Fly.io, or a VPS/container platform.

1. Build the app with `npm run build`.
2. Start it with `npm start`.
3. Set the production environment variables on the host.
4. Point the public URL to your chosen domain.
5. Configure the Stripe webhook endpoint to:
   `/api/payments/webhook`
6. Run migrations before traffic reaches the new deployment.
7. Schedule `POST /api/cron/release-seat-holds` with `Authorization: Bearer <CRON_SECRET>` using the host scheduler or an external cron service.
8. Verify auth, booking, payment, and ticket delivery end to end.

## Security Notes

- No database or payment secrets are exposed to browser code.
- All booking, payment, and cleanup operations execute server-side.
- Webhook verification uses Stripe signature secrets.
- Admin page enforces authenticated ADMIN role.

