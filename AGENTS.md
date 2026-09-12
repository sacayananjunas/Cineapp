# CineBook Agent Team

## Shared Task List

- [x] App Agent: Build responsive pages (home, movie details, cinema, showtime seats, checkout, ticket, booking history, login, admin).
- [x] App Agent: Wire all pages to live database queries and server actions.
- [x] App Agent: Add loading/error/empty states and mobile-friendly layout.
- [x] Database Engine Agent: Implement Neon + Drizzle schema for all required tables.
- [x] Database Engine Agent: Generate migrations and add constraints/indexes/unique rules.
- [x] Database Engine Agent: Implement transactional seat hold + booking workflow with idempotency.
- [x] Database Engine Agent: Implement payment confirmation and webhook-safe state transitions.
- [x] Database Engine Agent: Implement idempotent expired-hold release endpoint protected by CRON secret.
- [x] Database Engine Agent: Add seed data for users, movies, cinemas, auditoriums, seats, and showtimes.
- [x] QA Agent: Add regression checklist and automated test scaffolding for critical booking/payment flows.
- [ ] QA Agent: Run integration tests against provisioned Neon and Stripe test environment.
- [ ] QA Agent: Execute Vercel preview + production verification.

## Agent-to-Agent Notes

- App Agent to Database Agent: Seat-map UI only books seats with status AVAILABLE; HELD, BOOKED, and BLOCKED are disabled.
- Database Agent to QA Agent: Concurrency guard is row locking plus unique booking-item seat constraint; validate with dual-session race.
- QA Agent to App Agent: Verify login/registration and admin authorization behavior in browser and API routes.

## Completion Gate

Do not mark project complete until all items below pass in a configured environment:

1. Drizzle migrations pass on a clean database.
2. Concurrent seat-booking race allows only one successful booking.
3. Stripe test payment success/failure/cancel and webhook idempotency pass.
4. Vercel deployed app works end to end in preview and production.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
