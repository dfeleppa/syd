import React from "react";
import Link from "next/link";
import { GoalsPath } from "../components/GoalsPath";
import { getTasksForDate, Task } from "./dashboardTasks";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function MissionPage() {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const todayKey = today.toISOString().slice(0, 10);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);

  const todayTasks: Task[] = getTasksForDate(todayKey);
  const tomorrowTasks: Task[] = getTasksForDate(tomorrowKey);

  return (
    <div className="min-h-screen px-1 py-2 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Business
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Daniel&#39;s Dashboard
            </h1>
          </div>
          <div className="flex gap-3 text-xs text-slate-700">
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-300">
              Local-first
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
              v0.1 — scratch pad
            </span>
          </div>
        </header>

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1.1fr)]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Mission card */}
            <section className="rounded-2xl border border-white/70 bg-gradient-to-b from-zinc-900/80 to-black px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-medium text-zinc-200">
                    Mission
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Automate everything possible in my business and create content around the process.
                  </p>
                </div>
              </div>
            </section>

            {/* AI usage & system health side-by-side */}
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 sm:px-6 sm:py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span>AI Spend (placeholder)</span>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                    Coming from ClawFace
                  </span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  $0.00
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Wiring to usage.db + pricing tables will go here.
                </p>
              </section>

              <section className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 sm:px-6 sm:py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span>System Health (placeholder)</span>
                  <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300">
                    Local host
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-700">
                  <p>CPU: 0% • Memory: 0% • Disk: 0%</p>
                  <p>Metrics will flow from a /api/system endpoint.</p>
                </div>
              </section>
            </div>

            {/* Agents & tasks */}
            <section className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 sm:px-6 sm:py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-900">
                  Agents & Tasks
                </h2>
                <Link
                  href="/planner"
                  className="text-xs text-slate-700 hover:text-slate-900"
                >
                  Open Planner
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-slate-900">
                <div className="rounded-xl border border-white/70 bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    You
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    Direction
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    Decide what matters this week.
                  </p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Sydney
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    Orchestration
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    Glue, safety checks, and infra.
                  </p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Olivia
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    Execution
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    Local model doing UI + content work.
                  </p>
                </div>
              </div>
            </section>

            {/* Goals Path */}
            <section className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 sm:px-6 sm:py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <GoalsPath />
            </section>

          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Today\'s focus scratchpad */}
            <section className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 sm:px-6 sm:py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-9000">
                    Today
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-900">
                    Today&apos;s Focus
                  </h2>
                  <p className="mt-1 text-xs text-slate-700">
                    This will eventually pull from your Planner board. For now, use it as a scratchpad
                    for what you and Elon decide is non‑negotiable today.
                  </p>
                </div>
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-800">
                <li>Wire Planner data model (columns, cards, assignees).</li>
                <li>Draft AI usage &amp; system health API contracts.</li>
                <li>Get Sydney and Elon both visible in Daniel&#39;s Dashboard.</li>
              </ul>
            </section>

            {/* Calendar-sourced tasks from DanielOS */}
            <section className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 sm:px-6 sm:py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    From Calendar
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-900">
                    Today&apos;s Tasks
                  </h2>
                  <p className="mt-1 text-xs text-slate-700">
                    Tasks for today coming from DanielOS. Google Calendar blocks will be merged in later.
                  </p>
                </div>
              </div>
              {todayTasks.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">
                  No tasks for today yet. Add them from the Calendar page.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-xs text-slate-800">
                  {todayTasks.slice(0, 5).map((task) => (
                    <li key={task.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{task.title}</p>
                        {task.startTime && (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {formatDate(today)} · {task.startTime}
                            {task.endTime ? `–${task.endTime}` : ""}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-700">
                        {task.area}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 sm:px-6 sm:py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Looking ahead
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-900">
                    Tomorrow&apos;s Tasks
                  </h2>
                  <p className="mt-1 text-xs text-slate-700">
                    Preview of tomorrow&apos;s schedule and high-priority tasks pulled from DanielOS tasks.
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">{formatDate(tomorrow)}</p>
              {tomorrowTasks.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No tasks yet for tomorrow.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-xs text-slate-800">
                  {tomorrowTasks.slice(0, 5).map((task) => (
                    <li key={task.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{task.title}</p>
                        {task.startTime && (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {task.startTime}
                            {task.endTime ? `–${task.endTime}` : ""}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-700">
                        {task.area}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}