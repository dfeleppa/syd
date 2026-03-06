import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "nutrition-log.json");

export type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export interface MealEntry {
  id: string;
  foodId: string;
  quantity: number;
}

export type DayMeals = Record<MealName, MealEntry[]>;

interface LogFile {
  [date: string]: DayMeals;
}

const EMPTY_DAY: DayMeals = {
  Breakfast: [],
  Lunch: [],
  Dinner: [],
  Snack: [],
};

async function readLog(): Promise<LogFile> {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    await fs.writeFile(LOG_PATH, JSON.stringify({}, null, 2), "utf8");
    return {};
  }
}

async function writeLog(log: LogFile) {
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2), "utf8");
}

function makeEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureEntryIds(day: DayMeals) {
  let changed = false;
  (Object.keys(day) as MealName[]).forEach((meal) => {
    const entries = day[meal] || [];
    entries.forEach((entry) => {
      if (!entry.id) {
        entry.id = makeEntryId();
        changed = true;
      }
    });
  });
  return changed;
}

async function readFoods() {
  try {
    const foodsRaw = await fs.readFile(
      path.join(process.cwd(), "foods.json"),
      "utf8",
    );
    return JSON.parse(foodsRaw) as {
      id: string;
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

async function computeTotals(day: DayMeals) {
  const foods = await readFoods();
  const index = new Map<
    string,
    { calories: number; protein: number; carbs: number; fat: number }
  >();
  for (const f of foods) {
    index.set(f.id, {
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
    });
  }

  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  (Object.keys(day) as (keyof typeof day)[]).forEach((meal) => {
    for (const entry of day[meal] || []) {
      const info = index.get(entry.foodId);
      if (!info) continue;
      const q = entry.quantity || 1;
      totals.calories += info.calories * q;
      totals.protein += info.protein * q;
      totals.carbs += info.carbs * q;
      totals.fat += info.fat * q;
    }
  });

  return totals;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const log = await readLog();
  const meals = log[date] ?? EMPTY_DAY;

  const updated = ensureEntryIds(meals);
  if (updated) {
    log[date] = meals;
    await writeLog(log);
  }

  const totals = await computeTotals(meals);

  return NextResponse.json({ date, meals, totals });
}

export async function POST(request: Request) {
  const body = await request.json();
  const date = body.date || new Date().toISOString().slice(0, 10);
  const meal: MealName = body.meal;
  const foodId: string | undefined = body.foodId;
  const quantity: number =
    body.quantity != null ? Number(body.quantity) : 1;

  if (
    !meal ||
    !foodId ||
    !["Breakfast", "Lunch", "Dinner", "Snack"].includes(meal)
  ) {
    return NextResponse.json(
      { error: "meal (Breakfast|Lunch|Dinner|Snack) and foodId are required" },
      { status: 400 },
    );
  }

  const log = await readLog();
  const day: DayMeals = log[date] ?? { ...EMPTY_DAY };
  const entries = day[meal] ?? [];

  const id = makeEntryId();
  entries.push({ id, foodId, quantity: quantity || 1 });

  day[meal] = entries;
  log[date] = day;
  await writeLog(log);

  const totals = await computeTotals(day);

  return NextResponse.json({ date, meals: day, totals });
}
