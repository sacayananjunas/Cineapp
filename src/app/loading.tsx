export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8">
        <div className="mb-4 h-6 w-48 rounded bg-slate-200" />
        <div className="mb-2 h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
      </div>
    </div>
  );
}
