import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const GOAL_PATH = path.join(process.cwd(), "nutrition-goal.json");

type GoalKind = "fat-loss" | "maintenance" | "gain";

type ActivityLevel = "sedentary" | "light" | "moderate" | "high";

interface MacroSplit {
  proteinPct: number;
  carbPct: number;
  fatPct: number;
}

interface NutritionGoal {
  goal: GoalKind;
  activity: ActivityLevel;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  estimatedTDEE: number;
  calorieAdjustment: number;
  macroSplit: MacroSplit;
}

function computeTDEE(goal: NutritionGoal): number {
  const { age, sex, heightCm, weightKg, activity } = goal;
  // Mifflin-St Jeor BMR
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

async function readGoal(): Promise<NutritionGoal> {
  try {
    const raw = await fs.readFile(GOAL_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    const defaults: NutritionGoal = {
      goal: "maintenance",
      activity: "moderate",
      age: 30,
      sex: "male",
      heightCm: 175,
      weightKg: 80,
      estimatedTDEE: 2400,
      calorieAdjustment: 0,
      macroSplit: { proteinPct: 30, carbPct: 40, fatPct: 30 },
    };
    await fs.writeFile(GOAL_PATH, JSON.stringify(defaults, null, 2), "utf8");
    return defaults;
  }
}

async function writeGoal(goal: NutritionGoal) {
  await fs.writeFile(GOAL_PATH, JSON.stringify(goal, null, 2), "utf8");
}

export async function GET() {
  const goal = await readGoal();
  return NextResponse.json(goal);
}

export async function POST(req: Request) {
  const body = await req.json();
  const current = await readGoal();

  const next: NutritionGoal = {
    ...current,
    goal: (body.goal as GoalKind) || current.goal,
    activity: (body.activity as ActivityLevel) || current.activity,
    age: Number(body.age ?? current.age) || current.age,
    sex: body.sex === "female" ? "female" : body.sex === "male" ? "male" : current.sex,
    heightCm: Number(body.heightCm ?? current.heightCm) || current.heightCm,
    weightKg: Number(body.weightKg ?? current.weightKg) || current.weightKg,
    estimatedTDEE: current.estimatedTDEE,
    calorieAdjustment:
      Number(body.calorieAdjustment ?? current.calorieAdjustment) || current.calorieAdjustment,
    macroSplit: {
      proteinPct:
        Number(body.macroSplit?.proteinPct ?? current.macroSplit.proteinPct) ||
        current.macroSplit.proteinPct,
      carbPct:
        Number(body.macroSplit?.carbPct ?? current.macroSplit.carbPct) ||
        current.macroSplit.carbPct,
      fatPct:
        Number(body.macroSplit?.fatPct ?? current.macroSplit.fatPct) || current.macroSplit.fatPct,
    },
  };

  // recompute TDEE based on updated stats
  next.estimatedTDEE = computeTDEE(next);

  await writeGoal(next);
  return NextResponse.json(next);
}

