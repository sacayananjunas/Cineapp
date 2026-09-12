import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { movies } from "@/db/schema";
import { getAdminOverview } from "@/lib/data";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const summary = await getAdminOverview();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl">Admin</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Movies</p><p className="text-2xl font-semibold">{summary.movieCount}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Bookings</p><p className="text-2xl font-semibold">{summary.bookingCount}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Confirmed</p><p className="text-2xl font-semibold">{summary.confirmedCount}</p></div>
      </div>

      <form
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5"
        action={async (formData) => {
          "use server";
          const title = String(formData.get("title") ?? "").trim();
          const synopsis = String(formData.get("synopsis") ?? "").trim();
          const language = String(formData.get("language") ?? "English").trim();
          const durationMinutes = Number(formData.get("duration") ?? 90);
          if (!title || !synopsis || !Number.isFinite(durationMinutes)) return;
          await db.insert(movies).values({ title, synopsis, language, durationMinutes, isPublished: true });
        }}
      >
        <h2 className="text-xl">Add movie</h2>
        <div className="mt-3 space-y-3">
          <input name="title" required placeholder="Title" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <textarea name="synopsis" required placeholder="Synopsis" className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="language" defaultValue="English" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="duration" type="number" min={30} defaultValue={100} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400">Create movie</button>
        </div>
      </form>
    </div>
  );
}
