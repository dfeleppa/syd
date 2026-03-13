import { NextResponse } from "next/server";

const BASE_URL = process.env.DANIELOS_SERVER_URL;
const TOKEN = process.env.DANIELOS_API_TOKEN;

function mustEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export async function proxy(path: string, init: RequestInit) {
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
