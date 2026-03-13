import fs from "fs";
import path from "path";

export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

export type TaskArea = "business" | "gym" | "personal" | "dev";

export interface Task {
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

export function getTasksForDate(date: string): Task[] {
  const all = readTasks();
  const tasks = all[date] ?? [];
  // Simple sort: tasks with startTime first, then by createdAt
  return [...tasks].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime && !b.startTime) return -1;
    if (!a.startTime && b.startTime) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
