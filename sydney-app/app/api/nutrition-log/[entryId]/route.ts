import { proxy } from "../../_proxy";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, ctx: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await ctx.params;
  const body = (await req.json()) as {
    date: string;
    meal: string;
    quantity?: number;
  };

  if (!body?.date || !body?.meal || body.quantity == null) {
    return NextResponse.json(
      { error: "date, meal, and quantity are required" },
      { status: 400 },
    );
  }

  return proxy("nutrition/entry", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      date: body.date,
      id: entryId,
      fromMeal: body.meal,
      quantity: body.quantity,
    }),
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await ctx.params;
  const body = (await req.json()) as { date: string; meal?: string };

  if (!body?.date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  return proxy("nutrition/entry", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      date: body.date,
      id: entryId,
      meal: body.meal,
    }),
  });
}
