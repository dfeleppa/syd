import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FOODS_PATH = path.join(process.cwd(), "foods.json");

export interface FoodItem {
  id: string;
  name: string;
  source: "recent" | "mine";
  calories: number;
  protein: number;
  carbs: number;
  fiber?: number;
  fat: number;
  satFat?: number;
}

async function readFoods(): Promise<FoodItem[]> {
  try {
    const raw = await fs.readFile(FOODS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    // seed with a couple defaults on first use
    const defaults: FoodItem[] = [
      {
        id: "chicken-breast",
        name: "Chicken breast",
        source: "recent",
        calories: 165,
        protein: 31,
        carbs: 0,
        fiber: 0,
        fat: 3,
        satFat: 1,
      },
      {
        id: "white-rice",
        name: "White rice",
        source: "recent",
        calories: 130,
        protein: 2,
        carbs: 28,
        fiber: 0,
        fat: 0,
        satFat: 0,
      },
      {
        id: "low-carb-buffalo-quesadilla",
        name: "Low Carb Buffalo Chicken Quesadilla",
        source: "mine",
        calories: 396,
        protein: 42,
        carbs: 21,
        fiber: 0,
        fat: 16,
        satFat: 0,
      },
    ];
    await fs.writeFile(FOODS_PATH, JSON.stringify(defaults, null, 2), "utf8");
    return defaults;
  }
}

async function writeFoods(foods: FoodItem[]) {
  await fs.writeFile(FOODS_PATH, JSON.stringify(foods, null, 2), "utf8");
}

export async function GET() {
  const foods = await readFoods();
  const recent = foods.filter((f) => f.source === "recent");
  const mine = foods.filter((f) => f.source === "mine");
  return NextResponse.json({ foods, recent, mine });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, source = "mine", calories, protein, carbs, fiber, fat, satFat } = body || {};
  if (!name || calories == null) {
    return NextResponse.json(
      { error: "name and calories are required" },
      { status: 400 }
    );
  }
  const id =
    body.id ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);

  const foods = await readFoods();
  const existingIndex = foods.findIndex((f) => f.id === id);
  const item: FoodItem = {
    id,
    name,
    source,
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fiber: Number(fiber) || 0,
    fat: Number(fat) || 0,
    satFat: Number(satFat) || 0,
  };
  if (existingIndex >= 0) {
    foods[existingIndex] = item;
  } else {
    foods.push(item);
  }
  await writeFoods(foods);
  const recent = foods.filter((f) => f.source === "recent");
  const mine = foods.filter((f) => f.source === "mine");
  return NextResponse.json({ ok: true, food: item, foods, recent, mine });
}

