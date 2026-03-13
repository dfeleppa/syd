import { proxy } from "../_proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  return proxy(`nutrition/log${qs}`, { method: "GET" });
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxy("nutrition/log", {
    method: "POST",
    headers: { "content-type": req.headers.get("content-type") || "application/json" },
    body,
  });
}
