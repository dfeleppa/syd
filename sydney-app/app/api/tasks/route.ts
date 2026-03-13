import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export type TaskId = string;
export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

export interface Task {
  id: TaskId;
  title: string;
  notes?: string;
  date: string; // YYYY-MM-DD (local)
  startTime?: string; // HH:MM local, optional
  endTime?: string; // HH:MM, optional
  area: "business" | "gym" | "personal" | "dev";
  source: "danielos" | "google";
  externalId?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export type TasksByDate = { [date: string]: Task[] };

const DATA_FILE = path.join(process.cwd(), "tasks.json");

function readTasks(): TasksByDate {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as TasksByDate;
    }
    return {};
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    console.error("Failed to read tasks.json", err);
    return {};
  }
}

function writeTasks(data: TasksByDate) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function ensureDate(tasks: TasksByDate, date: string): Task[] {
  if (!tasks[date]) tasks[date] = [];
  return tasks[date];
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
  }

  const all = readTasks();
  const tasks = all[date] ?? [];
  return NextResponse.json({ date, tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || typeof body.date !== "string") {
    return NextResponse.json({ error: "title and date are required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const newTask: Task = {
    id: generateId(),
    title: body.title,
    notes: typeof body.notes === "string" ? body.notes : undefined,
    date: body.date,
    startTime: typeof body.startTime === "string" ? body.startTime : undefined,
    endTime: typeof body.endTime === "string" ? body.endTime : undefined,
    area: body.area === "gym" || body.area === "personal" || body.area === "dev" ? body.area : "business",
    source: "danielos",
    status: "todo",
    createdAt: now,
    updatedAt: now,
  };

  const all = readTasks();
  const day = ensureDate(all, newTask.date);
  day.push(newTask);
  writeTasks(all);

  return NextResponse.json({ date: newTask.date, tasks: day }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.date !== "string") {
    return NextResponse.json({ error: "date is required to update a task" }, { status: 400 });
  }

  const all = readTasks();
  const day = ensureDate(all, body.date);
  const idx = day.findIndex((t) => t.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const existing = day[idx];
  const now = new Date().toISOString();

  const updated: Task = {
    ...existing,
    title: typeof body.title === "string" ? body.title : existing.title,
    notes: typeof body.notes === "string" ? body.notes : existing.notes,
    startTime: typeof body.startTime === "string" ? body.startTime : existing.startTime,
    endTime: typeof body.endTime === "string" ? body.endTime : existing.endTime,
    area:
      body.area === "business" ||
      body.area === "gym" ||
      body.area === "personal" ||
      body.area === "dev"
        ? body.area
        : existing.area,
    status:
      body.status === "todo" ||
      body.status === "in-progress" ||
      body.status === "done" ||
      body.status === "blocked"
        ? body.status
        : existing.status,
    updatedAt: now,
  };

  day[idx] = updated;
  writeTasks(all);

  return NextResponse.json({ date: updated.date, tasks: day });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const date = searchParams.get("date");

  if (!id || !date) {
    return NextResponse.json({ error: "id and date are required" }, { status: 400 });
  }

  const all = readTasks();
  const day = ensureDate(all, date);
  const next = day.filter((t) => t.id !== id);

  if (next.length === day.length) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  all[date] = next;
  writeTasks(all);

  return NextResponse.json({ date, tasks: next });
}
