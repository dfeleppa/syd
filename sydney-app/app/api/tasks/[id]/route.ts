import { NextResponse } from "next/server";

const BASE_URL = process.env.DANIELOS_SERVER_URL;
const TOKEN = process.env.DANIELOS_API_TOKEN;

function mustEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function forward(path: string, init: RequestInit) {
  const base = mustEnv("DANIELOS_SERVER_URL", BASE_URL);
  const token = mustEnv("DANIELOS_API_TOKEN", TOKEN);

  const url = new URL(path, base.endsWith("/") ? base : base + "/");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.text();
  return forward(`tasks/${id}`, {
    method: "PATCH",
    headers: { "content-type": req.headers.get("content-type") || "application/json" },
    body,
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return forward(`tasks/${id}`, { method: "DELETE" });
}
