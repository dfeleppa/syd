import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "nutrition-settings.json");

interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

async function readSettings(): Promise<NutritionTargets> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    const defaults: NutritionTargets = {
      calories: 2350,
      protein: 192,
      carbs: 216,
      fat: 80,
    };
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(defaults, null, 2), "utf8");
    return defaults;
  }
}

async function writeSettings(settings: NutritionTargets) {
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf8");
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const body = await req.json();
  const next: NutritionTargets = {
    calories: Number(body.calories) || 0,
    protein: Number(body.protein) || 0,
    carbs: Number(body.carbs) || 0,
    fat: Number(body.fat) || 0,
  };
  await writeSettings(next);
  return NextResponse.json(next);
}

