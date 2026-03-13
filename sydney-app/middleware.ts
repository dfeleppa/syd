import { NextResponse, type NextRequest } from "next/server";
import { cookieName, verifySession } from "./lib/auth";

const PUBLIC_PATH_PREFIXES = [
  "/api/auth/", // oauth endpoints
  "/auth/google", // connect page
  "/_next/",
  "/favicon.ico",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(cookieName())?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/google";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/auth/google", req.url));
    res.cookies.delete(cookieName());
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
