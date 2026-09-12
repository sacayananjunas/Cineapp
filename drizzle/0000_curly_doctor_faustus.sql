CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."seat_status" AS ENUM('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"target_table" text NOT NULL,
	"target_id" uuid,
	"details_json" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditoriums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cinema_id" uuid NOT NULL,
	"name" text NOT NULL,
	"seat_rows" integer NOT NULL,
	"seat_columns" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auditoriums_cinema_name_unique" UNIQUE("cinema_id","name")
);
--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"showtime_seat_id" uuid NOT NULL,
	"price_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"showtime_id" uuid NOT NULL,
	"booking_reference" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"subtotal_minor" integer NOT NULL,
	"service_fee_minor" integer NOT NULL,
	"tax_minor" integer NOT NULL,
	"total_minor" integer NOT NULL,
	"hold_expires_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cinemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_genres" (
	"movie_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movie_genres_movie_id_genre_id_pk" PRIMARY KEY("movie_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"synopsis" text NOT NULL,
	"language" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"poster_url" text,
	"release_date" timestamp with time zone,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_payment_id" text,
	"provider_session_id" text,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"webhook_idempotency_key" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auditorium_id" uuid NOT NULL,
	"row_label" text NOT NULL,
	"seat_number" integer NOT NULL,
	"seat_type" text DEFAULT 'STANDARD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seats_auditorium_position_unique" UNIQUE("auditorium_id","row_label","seat_number")
);
--> statement-breakpoint
CREATE TABLE "showtime_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"showtime_id" uuid NOT NULL,
	"seat_id" uuid NOT NULL,
	"status" "seat_status" DEFAULT 'AVAILABLE' NOT NULL,
	"hold_expires_at" timestamp with time zone,
	"held_by_user_id" uuid,
	"price_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "showtime_seats_unique" UNIQUE("showtime_id","seat_id")
);
--> statement-breakpoint
CREATE TABLE "showtimes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movie_id" uuid NOT NULL,
	"auditorium_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"base_price_minor" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"ticket_number" text NOT NULL,
	"qr_payload" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoriums" ADD CONSTRAINT "auditoriums_cinema_id_cinemas_id_fk" FOREIGN KEY ("cinema_id") REFERENCES "public"."cinemas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_showtime_seat_id_showtime_seats_id_fk" FOREIGN KEY ("showtime_seat_id") REFERENCES "public"."showtime_seats"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_showtime_id_showtimes_id_fk" FOREIGN KEY ("showtime_id") REFERENCES "public"."showtimes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_auditorium_id_auditoriums_id_fk" FOREIGN KEY ("auditorium_id") REFERENCES "public"."auditoriums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_showtime_id_showtimes_id_fk" FOREIGN KEY ("showtime_id") REFERENCES "public"."showtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_held_by_user_id_users_id_fk" FOREIGN KEY ("held_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_auditorium_id_auditoriums_id_fk" FOREIGN KEY ("auditorium_id") REFERENCES "public"."auditoriums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_table","target_id");--> statement-breakpoint
CREATE INDEX "auditoriums_cinema_idx" ON "auditoriums" USING btree ("cinema_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_items_showtime_seat_unique" ON "booking_items" USING btree ("showtime_seat_id");--> statement-breakpoint
CREATE INDEX "booking_items_booking_idx" ON "booking_items" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_reference_unique" ON "bookings" USING btree ("booking_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_idempotency_key_unique" ON "bookings" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "bookings_user_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cinemas_city_idx" ON "cinemas" USING btree ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "genres_name_unique" ON "genres" USING btree ("name");--> statement-breakpoint
CREATE INDEX "movies_title_idx" ON "movies" USING btree ("title");--> statement-breakpoint
CREATE INDEX "movies_language_idx" ON "movies" USING btree ("language");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_payment_unique" ON "payments" USING btree ("provider","provider_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_session_unique" ON "payments" USING btree ("provider","provider_session_id");--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seats_auditorium_idx" ON "seats" USING btree ("auditorium_id");--> statement-breakpoint
CREATE INDEX "showtime_seats_showtime_idx" ON "showtime_seats" USING btree ("showtime_id");--> statement-breakpoint
CREATE INDEX "showtime_seats_status_idx" ON "showtime_seats" USING btree ("status");--> statement-breakpoint
CREATE INDEX "showtimes_movie_idx" ON "showtimes" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "showtimes_auditorium_idx" ON "showtimes" USING btree ("auditorium_id");--> statement-breakpoint
CREATE INDEX "showtimes_starts_at_idx" ON "showtimes" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_booking_unique" ON "tickets" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_number_unique" ON "tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");
--> statement-breakpoint
ALTER TABLE "auditoriums" ADD CONSTRAINT "auditoriums_seat_rows_positive" CHECK ("seat_rows" > 0);--> statement-breakpoint
ALTER TABLE "auditoriums" ADD CONSTRAINT "auditoriums_seat_columns_positive" CHECK ("seat_columns" > 0);--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_seat_number_positive" CHECK ("seat_number" > 0);--> statement-breakpoint
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_time_window_valid" CHECK ("ends_at" > "starts_at");--> statement-breakpoint
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_base_price_non_negative" CHECK ("base_price_minor" >= 0);--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_price_non_negative" CHECK ("price_minor" >= 0);--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_subtotal_non_negative" CHECK ("subtotal_minor" >= 0);--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_fee_non_negative" CHECK ("service_fee_minor" >= 0);--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tax_non_negative" CHECK ("tax_minor" >= 0);--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_total_non_negative" CHECK ("total_minor" >= 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_non_negative" CHECK ("amount_minor" >= 0);