import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { name: string; email: string; password: string };

  const name = body.name?.trim();
  const email = body.email?.toLowerCase().trim();
  const password = body.password ?? "";

  if (!name || !email || password.length < 8) {
    return NextResponse.json({ error: "Invalid registration fields" }, { status: 400 });
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hash(password, 10);
  await db.insert(users).values({ name, email, passwordHash, role: "USER" });

  return NextResponse.json({ ok: true });
}
