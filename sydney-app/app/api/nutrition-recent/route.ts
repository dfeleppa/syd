import { proxy } from "../_proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meal = searchParams.get("meal");
  const limit = searchParams.get("limit");

  const qs = new URLSearchParams();
  if (meal) qs.set("meal", meal);
  if (limit) qs.set("limit", limit);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return proxy(`nutrition/recent${suffix}`, { method: "GET" });
}
