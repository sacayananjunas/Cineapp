import Link from "next/link";
import { auth } from "@/lib/auth";
import { AuthControls } from "@/components/auth-controls";

export async function TopNav() {
  const session = await auth();

  return (
    <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          CineBook
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/bookings" className="hover:text-slate-900">
            Bookings
          </Link>
          <Link href="/admin" className="hover:text-slate-900">
            Admin
          </Link>
          <span className="text-xs text-slate-500">{session?.user?.email ?? "Guest"}</span>
          <AuthControls />
        </nav>
      </div>
    </header>
  );
}
