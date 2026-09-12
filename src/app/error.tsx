"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-xl font-semibold text-rose-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-rose-800">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-white hover:bg-rose-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
