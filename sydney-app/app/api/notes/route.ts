import { proxy } from "../_proxy";

export async function GET() {
  return proxy("notes", { method: "GET" });
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxy("notes", {
    method: "POST",
    headers: { "content-type": req.headers.get("content-type") || "application/json" },
    body,
  });
}
