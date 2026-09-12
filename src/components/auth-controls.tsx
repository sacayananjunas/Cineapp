"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthControls() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <Link href="/login" className="rounded-full border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
        Login
      </Link>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
    >
      Logout
    </button>
  );
}
