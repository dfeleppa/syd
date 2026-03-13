import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";

import { loadEnv } from "./config.js";
import { requireBearer } from "./auth.js";
import { makePool } from "./db.js";

async function migrate(pool: ReturnType<typeof makePool>) {
  // Minimal, inline migrations (keeps build simple; we can move to a file-based system later)
  const migrations: { id: string; sql: string }[] = [
    {
      id: "001_init",
      sql: `
        CREATE TABLE IF NOT EXISTS foods (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          source TEXT NOT NULL CHECK (source IN ('recent','mine')),
          calories INT NOT NULL,
          protein INT NOT NULL DEFAULT 0,
          carbs INT NOT NULL DEFAULT 0,
          fiber INT NOT NULL DEFAULT 0,
          fat INT NOT NULL DEFAULT 0,
          sat_fat INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `,
    },
    {
      id: "002_nutrition",
      sql: `
        CREATE TABLE IF NOT EXISTS nutrition_log (
          date TEXT PRIMARY KEY,
          meals JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS nutrition_settings (
          id INT PRIMARY KEY DEFAULT 1,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS nutrition_goal (
          id INT PRIMARY KEY DEFAULT 1,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `,
    },
  ];

  // Ensure migrations table exists before we query it.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  for (const m of migrations) {
    const res = await pool.query("SELECT 1 FROM schema_migrations WHERE id=$1", [m.id]);
    if (res.rowCount) continue;
    await pool.query("BEGIN");
    try {
      await pool.query(m.sql);
      await pool.query("INSERT INTO schema_migrations (id) VALUES ($1)", [m.id]);
      await pool.query("COMMIT");
    } catch (e) {
      await pool.query("ROLLBACK");
      throw e;
    }
  }
}

export async function buildServer() {
  const env = loadEnv();
  const pool = makePool(env);
  await migrate(pool);

  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : false,
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });

  app.get("/health", async () => {
    return {
      ok: true,
      name: "danielos-server",
      ts: new Date().toISOString(),
    };
  });

  // Auth guard for everything else
  app.addHook("preHandler", async (req) => {
    if (req.routeOptions.url === "/health") return;
    requireBearer(req, env);
  });

  // Foods
  app.get("/foods", async () => {
    const { rows } = await pool.query(
      `SELECT id, name, source, calories, protein, carbs, fiber, fat, sat_fat AS "satFat" FROM foods ORDER BY name ASC`
    );
    const foods = rows;
    const recent = foods.filter((f: any) => f.source === "recent");
    const mine = foods.filter((f: any) => f.source === "mine");
    return { foods, recent, mine };
  });

  const FoodUpsertSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    source: z.enum(["recent", "mine"]).optional().default("mine"),
    calories: z.coerce.number().int(),
    protein: z.coerce.number().int().optional().default(0),
    carbs: z.coerce.number().int().optional().default(0),
    fiber: z.coerce.number().int().optional().default(0),
    fat: z.coerce.number().int().optional().default(0),
    satFat: z.coerce.number().int().optional().default(0),
  });

  app.post("/foods", async (req, reply) => {
    const parsed = FoodUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const body = parsed.data;
    const id =
      body.id ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64);

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
      [id, body.name, body.source, body.calories, body.protein, body.carbs, body.fiber, body.fat, body.satFat]
    );

    const food = {
      id,
      name: body.name,
      source: body.source,
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fiber: body.fiber,
      fat: body.fat,
      satFat: body.satFat,
    };

    const { rows } = await pool.query(
      `SELECT id, name, source, calories, protein, carbs, fiber, fat, sat_fat AS "satFat" FROM foods ORDER BY name ASC`
    );
    const foods = rows;
    const recent = foods.filter((f: any) => f.source === "recent");
    const mine = foods.filter((f: any) => f.source === "mine");

    return { ok: true, food, foods, recent, mine };
  });

  // Notes
  app.get("/notes", async () => {
    const { rows } = await pool.query(
      `SELECT id, title, content, updated_at AS "updatedAt" FROM notes ORDER BY updated_at DESC`
    );
    return { notes: rows };
  });

  const NoteUpsertSchema = z.object({
    id: z.string().optional(),
    title: z.string().optional().default(""),
    content: z.string().optional().default(""),
  });

  app.post("/notes", async (req, reply) => {
    const parsed = NoteUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { id, title, content } = parsed.data;
    const noteId = id || Math.random().toString(36).slice(2);

    await pool.query(
      `INSERT INTO notes (id, title, content, updated_at)
       VALUES ($1,$2,$3, now())
       ON CONFLICT (id) DO UPDATE SET
         title=excluded.title,
         content=excluded.content,
         updated_at=now()`,
      [noteId, title, content]
    );

    const { rows } = await pool.query(
      `SELECT id, title, content, updated_at AS "updatedAt" FROM notes ORDER BY updated_at DESC`
    );

    return { ok: true, id: noteId, notes: rows };
  });

  // Nutrition
  type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snack";
  type MealEntry = { id: string; foodId: string; quantity: number };
  type DayMeals = Record<MealName, MealEntry[]>;

  const EMPTY_DAY: DayMeals = {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: [],
  };

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

  async function computeTotals(day: DayMeals) {
    const { rows } = await pool.query(
      `SELECT id, calories, protein, carbs, fat FROM foods`
    );
    const index = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
    for (const f of rows) {
      index.set(f.id, {
        calories: Number(f.calories) || 0,
        protein: Number(f.protein) || 0,
        carbs: Number(f.carbs) || 0,
        fat: Number(f.fat) || 0,
      });
    }

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

  const MealNameSchema = z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]);

  app.get("/nutrition/log", async (req) => {
    const date = (req.query as any)?.date || new Date().toISOString().slice(0, 10);

    const existing = await pool.query(`SELECT meals FROM nutrition_log WHERE date=$1`, [date]);
    const meals: DayMeals = existing.rowCount ? (existing.rows[0].meals as DayMeals) : { ...EMPTY_DAY };

    const updated = ensureEntryIds(meals);
    if (updated) {
      await pool.query(
        `INSERT INTO nutrition_log (date, meals, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (date) DO UPDATE SET meals=excluded.meals, updated_at=now()`,
        [date, JSON.stringify(meals)]
      );
    }

    const totals = await computeTotals(meals);
    return { date, meals, totals };
  });

  const NutritionAddSchema = z.object({
    date: z.string().optional(),
    meal: MealNameSchema,
    foodId: z.string().min(1),
    quantity: z.coerce.number().optional().default(1),
  });

  app.post("/nutrition/log", async (req, reply) => {
    const parsed = NutritionAddSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { date: rawDate, meal, foodId, quantity } = parsed.data;
    const date = rawDate || new Date().toISOString().slice(0, 10);

    const existing = await pool.query(`SELECT meals FROM nutrition_log WHERE date=$1`, [date]);
    const day: DayMeals = existing.rowCount ? (existing.rows[0].meals as DayMeals) : { ...EMPTY_DAY };

    const entries = day[meal] ?? [];
    entries.push({ id: makeEntryId(), foodId, quantity: quantity || 1 });
    day[meal] = entries;

    await pool.query(
      `INSERT INTO nutrition_log (date, meals, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (date) DO UPDATE SET meals=excluded.meals, updated_at=now()`,
      [date, JSON.stringify(day)]
    );

    const totals = await computeTotals(day);
    return { date, meals: day, totals };
  });

  // Replace full-day meals (best for UI "edit then save")
  const DayMealsSchema = z.object({
    Breakfast: z.array(z.object({ id: z.string().optional(), foodId: z.string(), quantity: z.coerce.number().optional().default(1) })).default([]),
    Lunch: z.array(z.object({ id: z.string().optional(), foodId: z.string(), quantity: z.coerce.number().optional().default(1) })).default([]),
    Dinner: z.array(z.object({ id: z.string().optional(), foodId: z.string(), quantity: z.coerce.number().optional().default(1) })).default([]),
    Snack: z.array(z.object({ id: z.string().optional(), foodId: z.string(), quantity: z.coerce.number().optional().default(1) })).default([]),
  });

  app.put("/nutrition/log", async (req, reply) => {
    const date = (req.query as any)?.date || new Date().toISOString().slice(0, 10);
    const body = (req.body || {}) as any;

    const parsed = DayMealsSchema.safeParse(body.meals ?? body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const meals = parsed.data as any as DayMeals;
    ensureEntryIds(meals);

    await pool.query(
      `INSERT INTO nutrition_log (date, meals, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (date) DO UPDATE SET meals=excluded.meals, updated_at=now()`,
      [date, JSON.stringify(meals)]
    );

    const totals = await computeTotals(meals);
    return { date, meals, totals };
  });

  // Entry-level edits
  const NutritionEntryPatchSchema = z.object({
    date: z.string().optional(),
    id: z.string().min(1),
    fromMeal: MealNameSchema.optional(),
    toMeal: MealNameSchema.optional(),
    quantity: z.coerce.number().optional(),
  });

  app.patch("/nutrition/entry", async (req, reply) => {
    const parsed = NutritionEntryPatchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { date: rawDate, id, fromMeal, toMeal, quantity } = parsed.data;
    const date = rawDate || new Date().toISOString().slice(0, 10);

    const existing = await pool.query(`SELECT meals FROM nutrition_log WHERE date=$1`, [date]);
    const day: DayMeals = existing.rowCount ? (existing.rows[0].meals as DayMeals) : { ...EMPTY_DAY };

    // find the entry
    let foundMeal: MealName | null = null;
    let entry: MealEntry | null = null;

    const mealsToSearch: MealName[] = fromMeal ? [fromMeal] : ["Breakfast", "Lunch", "Dinner", "Snack"];
    for (const m of mealsToSearch) {
      const idx = (day[m] || []).findIndex((e) => e.id === id);
      if (idx !== -1) {
        foundMeal = m;
        entry = day[m][idx] ?? null;
        // remove from original meal if moving
        if (toMeal && toMeal !== m) {
          day[m].splice(idx, 1);
        }
        break;
      }
    }

    if (!foundMeal || !entry) return reply.code(404).send({ error: "entry not found" });

    if (quantity != null) entry.quantity = Number(quantity) || 1;

    const targetMeal: MealName = toMeal || foundMeal;
    if (toMeal && toMeal !== foundMeal) {
      day[targetMeal] = [...(day[targetMeal] || []), entry];
    }

    await pool.query(
      `INSERT INTO nutrition_log (date, meals, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (date) DO UPDATE SET meals=excluded.meals, updated_at=now()`,
      [date, JSON.stringify(day)]
    );

    const totals = await computeTotals(day);
    return { date, meals: day, totals };
  });

  const NutritionEntryDeleteSchema = z.object({
    date: z.string().optional(),
    id: z.string().min(1),
    meal: MealNameSchema.optional(),
  });

  app.delete("/nutrition/entry", async (req, reply) => {
    const parsed = NutritionEntryDeleteSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { date: rawDate, id, meal } = parsed.data;
    const date = rawDate || new Date().toISOString().slice(0, 10);

    const existing = await pool.query(`SELECT meals FROM nutrition_log WHERE date=$1`, [date]);
    const day: DayMeals = existing.rowCount ? (existing.rows[0].meals as DayMeals) : { ...EMPTY_DAY };

    const mealsToSearch: MealName[] = meal ? [meal] : ["Breakfast", "Lunch", "Dinner", "Snack"];
    let removed = false;

    for (const m of mealsToSearch) {
      const before = day[m]?.length || 0;
      day[m] = (day[m] || []).filter((e) => e.id !== id);
      if ((day[m]?.length || 0) !== before) {
        removed = true;
        break;
      }
    }

    if (!removed) return reply.code(404).send({ error: "entry not found" });

    await pool.query(
      `INSERT INTO nutrition_log (date, meals, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (date) DO UPDATE SET meals=excluded.meals, updated_at=now()`,
      [date, JSON.stringify(day)]
    );

    const totals = await computeTotals(day);
    return { date, meals: day, totals };
  });

  app.get("/nutrition/recent", async (req, reply) => {
    const meal = (req.query as any)?.meal as string | undefined;
    const limit = Number((req.query as any)?.limit || 6);

    const mealParsed = MealNameSchema.safeParse(meal);
    if (!mealParsed.success) {
      return reply.code(400).send({ error: "meal query param (Breakfast|Lunch|Dinner|Snack) is required" });
    }

    const datesRes = await pool.query(`SELECT date, meals FROM nutrition_log ORDER BY date DESC`);

    const seen = new Set<string>();
    const foodIds: string[] = [];

    for (const row of datesRes.rows) {
      const day: DayMeals = row.meals;
      const entries = (day as any)?.[mealParsed.data] || [];
      for (let i = entries.length - 1; i >= 0; i--) {
        const fid = entries[i]?.foodId;
        if (!fid || seen.has(fid)) continue;
        seen.add(fid);
        foodIds.push(fid);
        if (foodIds.length >= limit) break;
      }
      if (foodIds.length >= limit) break;
    }

    if (foodIds.length === 0) return { meal: mealParsed.data, items: [] };

    const foodsRes = await pool.query(
      `SELECT id, name, calories, protein, carbs, fiber, fat, sat_fat AS "satFat" FROM foods WHERE id = ANY($1::text[])`,
      [foodIds]
    );

    const index = new Map(foodsRes.rows.map((f: any) => [f.id, f]));
    const items = foodIds.map((id) => index.get(id)).filter(Boolean);

    return { meal: mealParsed.data, items };
  });

  const NutritionTargetsSchema = z.object({
    calories: z.coerce.number().optional().default(0),
    protein: z.coerce.number().optional().default(0),
    carbs: z.coerce.number().optional().default(0),
    fat: z.coerce.number().optional().default(0),
  });

  async function getSettings() {
    const res = await pool.query(`SELECT data FROM nutrition_settings WHERE id=1`);
    if (res.rowCount) return res.rows[0].data;
    const defaults = { calories: 2350, protein: 192, carbs: 216, fat: 80 };
    await pool.query(
      `INSERT INTO nutrition_settings (id, data, updated_at) VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET data=excluded.data, updated_at=now()`,
      [JSON.stringify(defaults)]
    );
    return defaults;
  }

  app.get("/nutrition/settings", async () => {
    return await getSettings();
  });

  app.post("/nutrition/settings", async (req, reply) => {
    const parsed = NutritionTargetsSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const next = parsed.data;
    await pool.query(
      `INSERT INTO nutrition_settings (id, data, updated_at) VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET data=excluded.data, updated_at=now()`,
      [JSON.stringify(next)]
    );
    return next;
  });

  type GoalKind = "fat-loss" | "maintenance" | "gain";
  type ActivityLevel = "sedentary" | "light" | "moderate" | "high";

  function computeTDEE(goal: any): number {
    const { age, sex, heightCm, weightKg, activity } = goal;
    const bmrBase = 10 * weightKg + 6.25 * heightCm - 5 * age;
    const bmr = sex === "female" ? bmrBase - 161 : bmrBase + 5;
    const activityFactor =
      activity === "sedentary"
        ? 1.2
        : activity === "light"
        ? 1.4
        : activity === "moderate"
        ? 1.6
        : 1.8;
    return Math.round(bmr * activityFactor);
  }

  async function getGoal() {
    const res = await pool.query(`SELECT data FROM nutrition_goal WHERE id=1`);
    if (res.rowCount) return res.rows[0].data;
    const defaults = {
      goal: "maintenance" as GoalKind,
      activity: "moderate" as ActivityLevel,
      age: 30,
      sex: "male" as "male" | "female",
      heightCm: 175,
      weightKg: 80,
      estimatedTDEE: 2400,
      calorieAdjustment: 0,
      macroSplit: { proteinPct: 30, carbPct: 40, fatPct: 30 },
    };
    await pool.query(
      `INSERT INTO nutrition_goal (id, data, updated_at) VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET data=excluded.data, updated_at=now()`,
      [JSON.stringify(defaults)]
    );
    return defaults;
  }

  app.get("/nutrition/goal", async () => {
    return await getGoal();
  });

  app.post("/nutrition/goal", async (req, reply) => {
    const body = (req.body || {}) as any;
    const current = await getGoal();

    const next = {
      ...current,
      goal: (body.goal as GoalKind) || current.goal,
      activity: (body.activity as ActivityLevel) || current.activity,
      age: Number(body.age ?? current.age) || current.age,
      sex: body.sex === "female" ? "female" : body.sex === "male" ? "male" : current.sex,
      heightCm: Number(body.heightCm ?? current.heightCm) || current.heightCm,
      weightKg: Number(body.weightKg ?? current.weightKg) || current.weightKg,
      estimatedTDEE: current.estimatedTDEE,
      calorieAdjustment: Number(body.calorieAdjustment ?? current.calorieAdjustment) || current.calorieAdjustment,
      macroSplit: {
        proteinPct: Number(body.macroSplit?.proteinPct ?? current.macroSplit.proteinPct) || current.macroSplit.proteinPct,
        carbPct: Number(body.macroSplit?.carbPct ?? current.macroSplit.carbPct) || current.macroSplit.carbPct,
        fatPct: Number(body.macroSplit?.fatPct ?? current.macroSplit.fatPct) || current.macroSplit.fatPct,
      },
    };

    next.estimatedTDEE = computeTDEE(next);

    await pool.query(
      `INSERT INTO nutrition_goal (id, data, updated_at) VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET data=excluded.data, updated_at=now()`,
      [JSON.stringify(next)]
    );

    return next;
  });

  const NutritionCopySchema = z.object({
    fromDate: z.string().min(1),
    fromMeal: MealNameSchema,
    toDate: z.string().min(1),
    toMeal: MealNameSchema,
  });

  app.post("/nutrition/copy", async (req, reply) => {
    const parsed = NutritionCopySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { fromDate, fromMeal, toDate, toMeal } = parsed.data;

    const fromRes = await pool.query(`SELECT meals FROM nutrition_log WHERE date=$1`, [fromDate]);
    const toRes = await pool.query(`SELECT meals FROM nutrition_log WHERE date=$1`, [toDate]);

    const fromDay: DayMeals = fromRes.rowCount ? (fromRes.rows[0].meals as DayMeals) : { ...EMPTY_DAY };
    const toDay: DayMeals = toRes.rowCount ? (toRes.rows[0].meals as DayMeals) : { ...EMPTY_DAY };

    const sourceEntries = fromDay[fromMeal] || [];
    if (sourceEntries.length === 0) {
      return { date: toDate, meals: toDay, totals: await computeTotals(toDay) };
    }

    const targetEntries = toDay[toMeal] || [];
    const copied = sourceEntries.map((entry) => ({
      id: makeEntryId(),
      foodId: entry.foodId,
      quantity: entry.quantity || 1,
    }));

    toDay[toMeal] = [...targetEntries, ...copied];

    await pool.query(
      `INSERT INTO nutrition_log (date, meals, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (date) DO UPDATE SET meals=excluded.meals, updated_at=now()`,
      [toDate, JSON.stringify(toDay)]
    );

    const totals = await computeTotals(toDay);
    return { date: toDate, meals: toDay, totals };
  });

  app.addHook("onClose", async () => {
    await pool.end();
  });

  return { app, env };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { app, env } = await buildServer();
  await app.listen({ host: env.HOST, port: env.PORT });
}
