import { NextResponse } from "next/server";
import fs from "fs";

interface GoalStep {
  id: string;
  title: string;
  detail?: string;
  status: "todo" | "in-progress" | "done";
  order: number;
}

interface GoalsPathEntry {
  id: string;
  name: string;
  description?: string;
  steps: GoalStep[];
}

interface GoalsFile {
  paths: GoalsPathEntry[];
}

import path from "path";

const GOALS_PATH = path.join(process.cwd(), "goals-path.json");

function readGoals(): GoalsFile {
  try {
    const raw = fs.readFileSync(GOALS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { paths: [] };
  }
}

function writeGoals(data: GoalsFile) {
  fs.writeFileSync(GOALS_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readGoals();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = readGoals();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { pathId, steps, name, description } = body as {
      pathId?: string;
      steps?: unknown;
      name?: string;
      description?: string;
    };

    if (!pathId) {
      return NextResponse.json({ error: "pathId is required" }, { status: 400 });
    }

    const paths: GoalsPathEntry[] = Array.isArray(current.paths) ? current.paths : [];
    const idx = paths.findIndex((p) => p.id === pathId);

    if (idx === -1) {
      // create new path
      const newPath = {
        id: pathId,
        name: name || "Untitled path",
        description: description || "",
        steps: Array.isArray(steps) ? steps : [],
      };
      paths.push(newPath);
    } else {
      const existing = paths[idx];
      paths[idx] = {
        ...existing,
        name: name ?? existing.name,
        description: description ?? existing.description,
        steps: Array.isArray(steps) ? steps : existing.steps,
      };
    }

    const next = { paths };
    writeGoals(next);

    return NextResponse.json(next);
  } catch (e) {
    console.error("Failed to update goals path", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
