import { NextResponse } from "next/server";
import { releaseExpiredSeatHolds } from "@/lib/booking";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";

  if (token !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await releaseExpiredSeatHolds();
  return NextResponse.json({ ok: true, ...result });
}
