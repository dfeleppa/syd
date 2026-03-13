"use client";

import React, { useState } from "react";

export default function GoogleAuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/google/url");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to get Google auth URL");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        setError("No auth URL returned");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error("Error starting Google auth", err);
      setError("Error starting Google auth");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-1 py-2 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Personal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Connect Google Calendar
          </h1>
          <p className="text-xs text-slate-600">
            This connects DanielOS to your Google Calendar using OAuth. Only this machine stores the
            tokens; nothing is shared outside your local environment.
          </p>
        </header>

        <section className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <p className="text-xs text-slate-700">
            When you click connect, you&apos;ll be redirected to Google to grant read-only access to your
            calendar. After approving, you&apos;ll come back here and DanielOS will start merging events
            into your Today/Tomorrow tasks view.
          </p>

          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-sky-500 bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Redirecting to Google…" : "Connect Google Calendar"}
          </button>

          {error && (
            <p className="mt-3 text-xs text-rose-600">
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
