import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const seatStatusEnum = pgEnum("seat_status", [
  "AVAILABLE",
  "HELD",
  "BOOKED",
  "BLOCKED",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
]);

const utcNow = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("USER").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: utcNow,
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)]
);

export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    synopsis: text("synopsis").notNull(),
    language: text("language").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    posterUrl: text("poster_url"),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: utcNow,
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("movies_title_idx").on(t.title), index("movies_language_idx").on(t.language)]
);

export const genres = pgTable(
  "genres",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    createdAt: utcNow,
  },
  (t) => [uniqueIndex("genres_name_unique").on(t.name)]
);

export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
    createdAt: utcNow,
  },
  (t) => [primaryKey({ columns: [t.movieId, t.genreId] })]
);

export const cinemas = pgTable(
  "cinemas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    address: text("address").notNull(),
    createdAt: utcNow,
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("cinemas_city_idx").on(t.city)]
);

export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cinemaId: uuid("cinema_id")
      .notNull()
      .references(() => cinemas.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    seatRows: integer("seat_rows").notNull(),
    seatColumns: integer("seat_columns").notNull(),
    createdAt: utcNow,
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("auditoriums_cinema_name_unique").on(t.cinemaId, t.name),
    index("auditoriums_cinema_idx").on(t.cinemaId),
  ]
);

export const seats = pgTable(
  "seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    rowLabel: text("row_label").notNull(),
    seatNumber: integer("seat_number").notNull(),
    seatType: text("seat_type").default("STANDARD").notNull(),
    createdAt: utcNow,
  },
  (t) => [
    unique("seats_auditorium_position_unique").on(t.auditoriumId, t.rowLabel, t.seatNumber),
    index("seats_auditorium_idx").on(t.auditoriumId),
  ]
);

export const showtimes = pgTable(
  "showtimes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    basePriceMinor: integer("base_price_minor").notNull(),
    currency: text("currency").default("USD").notNull(),
    createdAt: utcNow,
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("showtimes_movie_idx").on(t.movieId),
    index("showtimes_auditorium_idx").on(t.auditoriumId),
    index("showtimes_starts_at_idx").on(t.startsAt),
  ]
);

export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    status: seatStatusEnum("status").default("AVAILABLE").notNull(),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    heldByUserId: uuid("held_by_user_id").references(() => users.id, { onDelete: "set null" }),
    priceMinor: integer("price_minor").notNull(),
    createdAt: utcNow,
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("showtime_seats_unique").on(t.showtimeId, t.seatId),
    index("showtime_seats_showtime_idx").on(t.showtimeId),
    index("showtime_seats_status_idx").on(t.status),
  ]
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "restrict" }),
    bookingReference: text("booking_reference").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: bookingStatusEnum("status").default("PENDING").notNull(),
    currency: text("currency").default("USD").notNull(),
    subtotalMinor: integer("subtotal_minor").notNull(),
    serviceFeeMinor: integer("service_fee_minor").notNull(),
    taxMinor: integer("tax_minor").notNull(),
    totalMinor: integer("total_minor").notNull(),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }).notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: utcNow,
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("bookings_reference_unique").on(t.bookingReference),
    uniqueIndex("bookings_idempotency_key_unique").on(t.idempotencyKey),
    index("bookings_user_idx").on(t.userId),
    index("bookings_status_idx").on(t.status),
  ]
);

export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id")
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: "restrict" }),
    priceMinor: integer("price_minor").notNull(),
    createdAt: utcNow,
  },
  (t) => [
    uniqueIndex("booking_items_showtime_seat_unique").on(t.showtimeSeatId),
    index("booking_items_booking_idx").on(t.bookingId),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    provider: text("provider").default("stripe").notNull(),
    providerPaymentId: text("provider_payment_id"),
    providerSessionId: text("provider_session_id"),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").default("USD").notNull(),
    webhookIdempotencyKey: text("webhook_idempotency_key"),
    metadata: text("metadata"),
    createdAt: utcNow,
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("payments_provider_payment_unique").on(t.provider, t.providerPaymentId),
    uniqueIndex("payments_provider_session_unique").on(t.provider, t.providerSessionId),
    index("payments_booking_idx").on(t.bookingId),
    index("payments_status_idx").on(t.status),
  ]
);

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    ticketNumber: text("ticket_number").notNull(),
    qrPayload: text("qr_payload").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: utcNow,
  },
  (t) => [
    uniqueIndex("tickets_booking_unique").on(t.bookingId),
    uniqueIndex("tickets_number_unique").on(t.ticketNumber),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetTable: text("target_table").notNull(),
    targetId: uuid("target_id"),
    detailsJson: text("details_json"),
    createdAt: utcNow,
  },
  (t) => [index("audit_logs_target_idx").on(t.targetTable, t.targetId)]
);

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  items: many(bookingItems),
  payments: many(payments),
  ticket: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
}));
