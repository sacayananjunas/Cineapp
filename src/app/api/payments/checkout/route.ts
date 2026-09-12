import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { bookingId: string };
  if (!body.bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const stripeSession = await createCheckoutSession(body.bookingId, session.user.id, baseUrl);

  return NextResponse.json({ checkoutUrl: stripeSession.url });
}
