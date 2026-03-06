import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { DayMeals, MealName } from "../route";

const LOG_PATH = path.join(process.cwd(), "nutrition-log.json");

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

async function writeLog(log: LogFile) {
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2), "utf8");
}

function findEntryInDay(
  day: DayMeals,
  entryId: string
): { meal: MealName; index: number } | null {
  for (const meal of Object.keys(day) as MealName[]) {
    const entries = day[meal] || [];
    const idx = entries.findIndex((e) => e.id === entryId);
    if (idx !== -1) {
      return { meal, index: idx };
    }
  }
  return null;
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

export async function PATCH(
  request: Request,
  { params }: { params: { entryId: string } },
) {
  const { entryId } = params;
  const body = await request.json();
  const { date, meal, quantity, foodId } = body as {
    date: string;
    meal: MealName;
    quantity?: number;
    foodId?: string;
  };

  if (!date || !meal || quantity == null) {
    return NextResponse.json(
      { error: "date, meal, and quantity are required" },
      { status: 400 },
    );
  }

  const log = await readLog();
  const day: DayMeals | undefined = log[date];
  if (!day) {
    return NextResponse.json(
      { error: "No log for given date" },
      { status: 404 },
    );
  }

  const entries = day[meal] || [];
  const idx = entries.findIndex((e) => e.id === entryId);
  let targetMeal: MealName = meal;
  let targetIdx = idx;
  if (targetIdx === -1) {
    (Object.keys(day) as MealName[]).some((key) => {
      const foundIdx = (day[key] || []).findIndex((e) => e.id === entryId);
      if (foundIdx !== -1) {
        targetMeal = key;
        targetIdx = foundIdx;
        return true;
      }
      return false;
    });
  }
  if (targetIdx === -1) {
    const found = findEntryInDay(day, entryId);
    if (found) {
      targetMeal = found.meal;
      targetIdx = found.index;
    } else if (foodId) {
      const mealEntries = day[meal] || [];
      const foodIdx = mealEntries.findIndex((e) => e.foodId === foodId);
      if (foodIdx !== -1) {
        targetMeal = meal;
        targetIdx = foodIdx;
      }
    }
  }

  const nextQuantity = Number(quantity);
  if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
    return NextResponse.json(
      { error: "quantity must be > 0" },
      { status: 400 },
    );
  }

  const targetEntries = day[targetMeal] || [];
  targetEntries[targetIdx] = {
    ...targetEntries[targetIdx],
    quantity: nextQuantity,
  };
  day[targetMeal] = targetEntries;
  log[date] = day;
  await writeLog(log);

  const totals = await computeTotals(day);

  return NextResponse.json({ date, meals: day, totals });
}

export async function DELETE(
  request: Request,
  { params }: { params: { entryId: string } },
) {
  const { entryId } = params;
  const body = await request.json();
  const { date, meal, foodId } = body as {
    date: string;
    meal: MealName;
    foodId?: string;
  };

  if (!date || !meal) {
    return NextResponse.json(
      { error: "date and meal are required" },
      { status: 400 },
    );
  }

  const log = await readLog();
  const day: DayMeals | undefined = log[date];
  if (!day) {
    return NextResponse.json(
      { error: "No log for given date" },
      { status: 404 },
    );
  }

  const entries = day[meal] || [];
  const idx = entries.findIndex((e) => e.id === entryId);
  let targetMeal: MealName = meal;
  let targetIdx = idx;
  if (targetIdx === -1) {
    (Object.keys(day) as MealName[]).some((key) => {
      const foundIdx = (day[key] || []).findIndex((e) => e.id === entryId);
      if (foundIdx !== -1) {
        targetMeal = key;
        targetIdx = foundIdx;
        return true;
      }
      return false;
    });
  }
  if (targetIdx === -1) {
    const found = findEntryInDay(day, entryId);
    if (found) {
      targetMeal = found.meal;
      targetIdx = found.index;
    } else if (foodId) {
      const mealEntries = day[meal] || [];
      const foodIdx = mealEntries.findIndex((e) => e.foodId === foodId);
      if (foodIdx !== -1) {
        targetMeal = meal;
        targetIdx = foodIdx;
      }
    }
  }

  const targetEntries = day[targetMeal] || [];
  targetEntries.splice(targetIdx, 1);
  day[targetMeal] = targetEntries;
  log[date] = day;
  await writeLog(log);

  const totals = await computeTotals(day);

  return NextResponse.json({ date, meals: day, totals });
}
