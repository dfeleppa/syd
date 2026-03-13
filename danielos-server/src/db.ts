import pg from "pg";
import type { Env } from "./config.js";

const { Pool } = pg;

export function makePool(env: Env) {
  return new Pool({
    connectionString: env.DATABASE_URL,
  });
}
