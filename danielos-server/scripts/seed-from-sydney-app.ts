import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const { Pool } = pg;

type FoodItem = {
  id: string;
  name: string;
  source: "recent" | "mine";
  calories: number;
  protein: number;
  carbs: number;
  fiber?: number;
  fat: number;
  satFat?: number;
};

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snack";

type MealEntry = {
  id: string;
  foodId: string;
  quantity: number;
};

type DayMeals = Record<MealName, MealEntry[]>;

type NutritionLogFile = Record<string, DayMeals>; // date -> meals

type NutritionTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type NutritionGoal = any;

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function main() {
  const databaseUrl = mustEnv("DATABASE_URL");
  const workspaceRoot = mustEnv("SYDNEY_APP_DIR");

  const pool = new Pool({ connectionString: databaseUrl });

  const foodsPath = path.join(workspaceRoot, "foods.json");
  const notesPath = path.join(workspaceRoot, "notes.json");
  const logPath = path.join(workspaceRoot, "nutrition-log.json");
  const settingsPath = path.join(workspaceRoot, "nutrition-settings.json");
  const goalPath = path.join(workspaceRoot, "nutrition-goal.json");

  const foods = (await readJson<FoodItem[]>(foodsPath)) ?? [];
  const notes = (await readJson<Note[]>(notesPath)) ?? [];
  const log = (await readJson<NutritionLogFile>(logPath)) ?? {};
  const settings = (await readJson<NutritionTargets>(settingsPath)) ?? null;
  const goal = (await readJson<NutritionGoal>(goalPath)) ?? null;

  const stats: Record<string, number> = {
    foods_upserted: 0,
    notes_upserted: 0,
    nutrition_days_upserted: 0,
    nutrition_settings_upserted: 0,
    nutrition_goal_upserted: 0,
  };

  const toInt = (x: any) => {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n);
  };

  await pool.query("BEGIN");
  try {
    // Foods
    for (const f of foods) {
      await pool.query(
        `INSERT INTO foods (id, name, source, calories, protein, carbs, fiber, fat, sat_fat, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
         ON CONFLICT (id) DO UPDATE SET
           name=excluded.name,
           source=excluded.source,
           calories=excluded.calories,
           protein=excluded.protein,
           carbs=excluded.carbs,
           fiber=excluded.fiber,
           fat=excluded.fat,
           sat_fat=excluded.sat_fat,
           updated_at=now()`,
        [
          f.id,
          f.name,
          f.source,
          toInt(f.calories),
          toInt(f.protein),
          toInt(f.carbs),
          toInt(f.fiber),
          toInt(f.fat),
          toInt(f.satFat),
        ]
      );
      stats.foods_upserted++;
    }

    // Notes
    for (const n of notes) {
      const updatedAt = n.updatedAt ? new Date(n.updatedAt) : new Date();
      await pool.query(
        `INSERT INTO notes (id, title, content, updated_at)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET
           title=excluded.title,
           content=excluded.content,
           updated_at=excluded.updated_at`,
        [n.id, n.title ?? "", n.content ?? "", updatedAt.toISOString()]
      );
      stats.notes_upserted++;
    }

    // Nutrition log (date -> meals JSON)
    const dates = Object.keys(log);
    for (const date of dates) {
      const meals = log[date];
      if (!meals) continue;
      await pool.query(
        `INSERT INTO nutrition_log (date, meals, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (date) DO UPDATE SET meals=excluded.meals, updated_at=now()`,
        [date, JSON.stringify(meals)]
      );
      stats.nutrition_days_upserted++;
    }

    // Settings / Goal (singletons)
    if (settings) {
      await pool.query(
        `INSERT INTO nutrition_settings (id, data, updated_at)
         VALUES (1, $1::jsonb, now())
         ON CONFLICT (id) DO UPDATE SET data=excluded.data, updated_at=now()`,
        [JSON.stringify(settings)]
      );
      stats.nutrition_settings_upserted = 1;
    }

    if (goal) {
      await pool.query(
        `INSERT INTO nutrition_goal (id, data, updated_at)
         VALUES (1, $1::jsonb, now())
         ON CONFLICT (id) DO UPDATE SET data=excluded.data, updated_at=now()`,
        [JSON.stringify(goal)]
      );
      stats.nutrition_goal_upserted = 1;
    }

    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  } finally {
    await pool.end();
  }

  console.log(JSON.stringify({ ok: true, stats }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
