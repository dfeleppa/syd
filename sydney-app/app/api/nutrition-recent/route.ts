import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { DayMeals, MealName } from "../nutrition-log/route";

const LOG_PATH = path.join(process.cwd(), "nutrition-log.json");
const FOODS_PATH = path.join(process.cwd(), "foods.json");

interface LogFile {
  [date: string]: DayMeals;
}

async function readLog(): Promise<LogFile> {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function readFoods() {
  try {
    const raw = await fs.readFile(FOODS_PATH, "utf8");
    return JSON.parse(raw) as {
      id: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fiber?: number;
      fat: number;
      satFat?: number;
    }[];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meal = searchParams.get("meal") as MealName | null;
  const limit = Number(searchParams.get("limit") || 6);

  if (!meal || !["Breakfast", "Lunch", "Dinner", "Snack"].includes(meal)) {
    return NextResponse.json(
      { error: "meal query param (Breakfast|Lunch|Dinner|Snack) is required" },
      { status: 400 },
    );
  }

  const log = await readLog();
  const dates = Object.keys(log).sort((a, b) => (a < b ? 1 : -1)); // newest -> oldest

  const seen = new Set<string>();
  const foodIds: string[] = [];

  for (const date of dates) {
    const day = log[date];
    if (!day) continue;
    const entries = day[meal] || [];

    // newest entries first within the meal
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      const fid = entry?.foodId;
      if (!fid || seen.has(fid)) continue;
      seen.add(fid);
      foodIds.push(fid);
      if (foodIds.length >= limit) break;
    }

    if (foodIds.length >= limit) break;
  }

  const foods = await readFoods();
  const index = new Map(foods.map((f) => [f.id, f]));
  const items = foodIds
    .map((id) => index.get(id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  return NextResponse.json({ meal, items });
}
