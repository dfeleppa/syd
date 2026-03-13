import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "danielos_session";

export function cookieName() {
  return COOKIE_NAME;
}

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export type Session = {
  sub: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
};

export async function signSession(payload: Omit<Session, "iat" | "exp">) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 30; // 30 days

  return await new SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string") return null;
    const email = payload.email;
    if (typeof email !== "string") return null;

    return {
      sub: payload.sub,
      email,
      name: typeof payload.name === "string" ? payload.name : undefined,
      iat: Number(payload.iat || 0),
      exp: Number(payload.exp || 0),
    };
  } catch {
    return null;
  }
}

export function isEmailAllowed(email: string) {
  const allowed = (process.env.ALLOWED_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length === 0) return true; // default allow if not configured
  return allowed.includes(email);
}
