import { proxy } from "../_proxy";

export async function POST(req: Request) {
  const body = await req.text();
  return proxy("nutrition/copy", {
    method: "POST",
    headers: { "content-type": req.headers.get("content-type") || "application/json" },
    body,
  });
}
