import { NextResponse } from "next/server";

function parseNumberAfter(raw: string, keyword: string): number | null {
  const lower = raw.toLowerCase();
  const idx = lower.indexOf(keyword.toLowerCase());
  if (idx === -1) return null;
  const slice = lower.slice(idx, idx + 40);
  const match = slice.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return Number(match[1]);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = (body.name || "").trim();
  const labelText: string = body.labelText || "";

  if (!labelText.trim()) {
    return NextResponse.json(
      { error: "labelText is required" },
      { status: 400 },
    );
  }

  const raw = labelText.replace(/\s+/g, " ").toLowerCase();

  const calories =
    parseNumberAfter(raw, "cal") ??
    parseNumberAfter(raw, "kcal") ??
    null;
  const protein =
    parseNumberAfter(raw, "protein") ??
    parseNumberAfter(raw, "prot") ??
    null;
  const carbs =
    parseNumberAfter(raw, "carb") ??
    parseNumberAfter(raw, "carbohydrate") ??
    null;
  const fat =
    parseNumberAfter(raw, "fat") ??
    null;

  return NextResponse.json({
    name,
    calories: calories ?? 0,
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0,
  });
}

