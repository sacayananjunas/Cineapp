# QA Agent Checklist

## Auth and Authorization

- Register a new user via /login create-account flow.
- Login and logout with valid credentials.
- Verify unauthenticated users are redirected from /bookings, /checkout/[id], /ticket/[id], /admin.
- Verify non-admin users cannot access /admin.

## Search and Discovery

- Filter movies by title, genre, language, cinema, and date on home page.
- Verify filtered results match seed data.

## Booking Flow

- Open a showtime seat map and confirm BOOKED/BLOCKED/HELD seats are not selectable.
- Create a seat hold and verify checkout totals include subtotal + fees + tax.
- Complete payment in Stripe test mode and verify booking status moves to CONFIRMED and ticket is generated.

## Concurrency and Idempotency

- From two sessions, attempt to hold the same seat simultaneously.
- Confirm exactly one request succeeds and one fails with seat availability error.
- Replay hold request with same idempotency key and confirm same booking is returned.

## Expiry and Cleanup

- Create a pending hold and wait for hold expiration.
- Call POST /api/cron/release-seat-holds with CRON secret.
- Verify held seats return to AVAILABLE and pending bookings move to EXPIRED.
- Re-run cleanup endpoint and confirm idempotent output (safe repeated execution).

## Payment Webhook Reliability

- Send checkout.session.completed and verify booking confirms once.
- Re-send same webhook and verify no duplicate ticket/booking side effects.
- Send checkout.session.expired and async_payment_failed and verify booking/payment statuses update appropriately.

## Deployment

- Run migrations against a clean Neon database.
- Verify preview deployment works with preview env vars.
- Verify production deployment and end-to-end booking flow.
