import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "nutrition-log.json");
const FOODS_PATH = path.join(process.cwd(), "foods.json");

type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snack";

interface MealEntry {
  id: string;
  foodId: string;
  quantity: number;
}

type DayMeals = Record<MealName, MealEntry[]>;

interface LogFile {
  [date: string]: DayMeals;
}

const EMPTY_DAY: DayMeals = {
  Breakfast: [],
  Lunch: [],
  Dinner: [],
  Snack: [],
};

function makeEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readLog(): Promise<LogFile> {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLog(log: LogFile) {
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2), "utf8");
}

async function readFoods() {
  try {
    const foodsRaw = await fs.readFile(FOODS_PATH, "utf8");
    return JSON.parse(foodsRaw) as {
      id: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[];
  } catch {
    return [];
  }
}

async function computeTotals(day: DayMeals) {
  const foods = await readFoods();
  const index = new Map(
    foods.map((food) => [food.id, food])
  );

  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  (Object.keys(day) as MealName[]).forEach((meal) => {
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

export async function POST(request: Request) {
  const body = await request.json();
  const { fromDate, fromMeal, toDate, toMeal } = body as {
    fromDate: string;
    fromMeal: MealName;
    toDate: string;
    toMeal: MealName;
  };

  if (!fromDate || !toDate || !fromMeal || !toMeal) {
    return NextResponse.json(
      { error: "fromDate, fromMeal, toDate, and toMeal are required" },
      { status: 400 }
    );
  }

  const log = await readLog();
  const fromDay = log[fromDate] ?? EMPTY_DAY;
  const toDay: DayMeals = log[toDate] ?? { ...EMPTY_DAY };

  const sourceEntries = fromDay[fromMeal] || [];
  if (sourceEntries.length === 0) {
    return NextResponse.json({ date: toDate, meals: toDay, totals: await computeTotals(toDay) });
  }

  const targetEntries = toDay[toMeal] || [];
  const copied = sourceEntries.map((entry) => ({
    id: makeEntryId(),
    foodId: entry.foodId,
    quantity: entry.quantity || 1,
  }));

  toDay[toMeal] = [...targetEntries, ...copied];
  log[toDate] = toDay;
  await writeLog(log);

  const totals = await computeTotals(toDay);
  return NextResponse.json({ date: toDate, meals: toDay, totals });
}
