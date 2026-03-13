"use client";

import React, { useEffect, useState } from "react";

type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

type TaskArea = "business" | "gym" | "personal" | "dev";

type Task = {
  id: string;
  title: string;
  notes?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  area: TaskArea;
  source: "danielos" | "google";
  externalId?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export default function CalendarPage() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [today] = useState(() => new Date());
  const [tomorrow] = useState(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const baseToday = toISODate(today);
        const baseTomorrow = toISODate(tomorrow);

        const [resToday, resTomorrow] = await Promise.all([
          fetch(`/api/tasks?date=${encodeURIComponent(baseToday)}`, {
            signal: controller.signal,
          }),
          fetch(`/api/tasks?date=${encodeURIComponent(baseTomorrow)}`, {
            signal: controller.signal,
          }),
        ]);

        if (resToday.ok) {
          const data = (await resToday.json()) as { date: string; tasks: Task[] };
          setTodayTasks(data.tasks || []);
        } else {
          setTodayTasks([]);
        }

        if (resTomorrow.ok) {
          const data = (await resTomorrow.json()) as { date: string; tasks: Task[] };
          setTomorrowTasks(data.tasks || []);
        } else {
          setTomorrowTasks([]);
        }
      } catch (err) {
        if ((err as DOMException).name !== "AbortError") {
          console.error("Failed to load tasks", err);
        }
        setTodayTasks([]);
        setTomorrowTasks([]);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [today, tomorrow]);

  const areaBadge = (area: TaskArea) => {
    const base = "rounded-full px-2 py-0.5 text-[10px]";
    switch (area) {
      case "gym":
        return `${base} bg-sky-50 text-sky-700`;
      case "personal":
        return `${base} bg-purple-50 text-purple-700`;
      case "dev":
        return `${base} bg-amber-50 text-amber-700`;
      case "business":
      default:
        return `${base} bg-emerald-50 text-emerald-700`;
    }
  };

  const statusBadge = (status: TaskStatus) => {
    const base = "rounded-full px-2 py-0.5 text-[10px]";
    switch (status) {
      case "in-progress":
        return `${base} bg-sky-100 text-sky-700`;
      case "done":
        return `${base} bg-emerald-100 text-emerald-700`;
      case "blocked":
        return `${base} bg-rose-100 text-rose-700`;
      case "todo":
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
  };

  const tasksList = (tasks: Task[]) => {
    if (loading) {
      return (
        <p className="mt-3 text-xs text-slate-500">Loading tasks…</p>
      );
    }

    if (!tasks.length) {
      return (
        <p className="mt-3 text-xs text-slate-500">
          No tasks yet for this day. You&apos;ll be able to add them from here and from the timeline.
        </p>
      );
    }

    return (
      <ul className="mt-3 space-y-1.5 text-xs text-slate-800">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-start justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5"
          >
            <div className="flex-1">
              <p className="font-medium text-slate-900">
                {task.title}
              </p>
              {task.startTime && (
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {task.startTime}
                  {task.endTime ? `–${task.endTime}` : ""}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={areaBadge(task.area)}>
                {task.area}
              </span>
              <span className={statusBadge(task.status)}>
                {task.status === "in-progress" ? "in progress" : task.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen px-1 py-2 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Personal
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Calendar
            </h1>
            <p className="mt-2 max-w-xl text-xs text-slate-600">
              This will become the source of truth for your days: Google Calendar events,
              DanielOS tasks, and blocks of focused work, all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-700">
            <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-sky-500">
              Google Calendar integration · TODO
            </span>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-400">
              DanielOS Tasks · wired
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr),minmax(0,1fr)]">
          {/* Main calendar / timeline column */}
          <div className="space-y-4">
            {/* Day switcher (visual only for now) */}
            <section className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-xs shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-700"
                  aria-label="Previous day"
                >
                  &lt;
                </button>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Today
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatDate(today)}
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-700"
                  aria-label="Next day"
                >
                  &gt;
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">
                  Today
                </button>
                <button className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-50">
                  Week view (soon)
                </button>
              </div>
            </section>

            {/* Timeline scaffold */}
            <section className="rounded-2xl border border-white/70 bg-white/90 px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-medium text-slate-900">Day timeline</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
                  Google + DanielOS tasks (planned)
                </span>
              </div>
              <div className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-xs text-slate-800">
                {["6:00", "7:00", "8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"].map(
                  (time) => (
                    <React.Fragment key={time}>
                      <div className="text-right text-[10px] text-slate-400">{time}</div>
                      <div className="h-10 rounded-md border border-dashed border-slate-200 bg-slate-50/60" />
                    </React.Fragment>
                  )
                )}
              </div>
            </section>
          </div>

          {/* Right column: today/tomorrow tasks + upcoming events */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-white/70 bg-white/90 px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Today&apos;s Tasks (DanielOS)
              </p>
              <p className="mt-1 text-xs text-slate-700">
                These are your local DanielOS tasks for today. Google events will join this view later.
              </p>
              {tasksList(todayTasks)}
            </section>

            <section className="rounded-2xl border border-white/70 bg-white/90 px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Tomorrow&apos;s Tasks (preview)
              </p>
              <p className="mt-1 text-xs text-slate-700">
                Preview of tomorrow&apos;s DanielOS tasks. This will keep you one day ahead.
              </p>
              <p className="mt-3 text-xs text-slate-600">
                {formatDate(tomorrow)}
              </p>
              {tasksList(tomorrowTasks)}
            </section>

            <section className="rounded-2xl border border-white/70 bg-white/90 px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Upcoming events (Google + DanielOS)
              </p>
              <p className="mt-1 text-xs text-slate-700">
                This will show the next few calendar entries and high-priority tasks across today and tomorrow.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-800">
                <li>No external events wired yet — integration TODO.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
