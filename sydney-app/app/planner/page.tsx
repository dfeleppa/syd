"use client";

import { useEffect, useMemo, useState } from "react";

type TaskStatus = "todo" | "doing" | "done";

interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  dueAt: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueAt, setDueAt] = useState<string>(""); // datetime-local
  const [priority, setPriority] = useState<number>(0);

  const todo = useMemo(() => tasks.filter((t) => t.status === "todo"), [tasks]);
  const doing = useMemo(() => tasks.filter((t) => t.status === "doing"), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createTask() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes,
          status,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          priority,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setTitle("");
        setNotes("");
        setStatus("todo");
        setDueAt("");
        setPriority(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function patchTask(id: string, patch: Partial<Task>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: patch.title,
          notes: patch.notes,
          status: patch.status,
          priority: patch.priority,
          dueAt: patch.dueAt,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function TaskRow({ task }: { task: Task }) {
    const dueLabel = task.dueAt ? new Date(task.dueAt).toLocaleString() : null;
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-zinc-100">
                {task.title}
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {task.status}
              </span>
              {task.priority ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                  p{task.priority}
                </span>
              ) : null}
            </div>
            {dueLabel ? (
              <p className="mt-1 text-xs text-zinc-400">Due: {dueLabel}</p>
            ) : null}
            {task.notes ? (
              <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-300">
                {task.notes}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <select
              value={task.status}
              onChange={(e) => patchTask(task.id, { status: e.target.value as TaskStatus })}
              className="rounded-lg border border-zinc-800 bg-black px-2 py-1 text-xs text-zinc-200"
            >
              <option value="todo">todo</option>
              <option value="doing">doing</option>
              <option value="done">done</option>
            </select>

            <button
              onClick={() => deleteTask(task.id)}
              className="rounded-lg border border-zinc-800 bg-black px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-8 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Work
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Planner
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Shared tasks database (same source of truth as iOS).
            </p>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </header>

        <section className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            New task
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="h-24 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-zinc-400">
                  Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="todo">todo</option>
                    <option value="doing">doing</option>
                    <option value="done">done</option>
                  </select>
                </label>

                <label className="text-xs text-zinc-400">
                  Priority
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
              </div>

              <label className="text-xs text-zinc-400">
                Due
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100"
                />
              </label>

              <button
                onClick={createTask}
                disabled={loading || !title.trim()}
                className="inline-flex items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-60"
              >
                + Add task
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Todo</h2>
            <div className="mt-3 space-y-3">
              {todo.length === 0 ? (
                <p className="text-xs text-zinc-500">No todo tasks.</p>
              ) : (
                todo.map((t) => <TaskRow key={t.id} task={t} />)
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Doing</h2>
            <div className="mt-3 space-y-3">
              {doing.length === 0 ? (
                <p className="text-xs text-zinc-500">No doing tasks.</p>
              ) : (
                doing.map((t) => <TaskRow key={t.id} task={t} />)
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Done</h2>
            <div className="mt-3 space-y-3">
              {done.length === 0 ? (
                <p className="text-xs text-zinc-500">No done tasks.</p>
              ) : (
                done.map((t) => <TaskRow key={t.id} task={t} />)
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
