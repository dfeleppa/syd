import type { FastifyRequest } from "fastify";
import type { Env } from "./config";

export function requireBearer(req: FastifyRequest, env: Env) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/.exec(h);
  const token = m?.[1];
  if (!token || token !== env.API_TOKEN) {
    const err: any = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
}
