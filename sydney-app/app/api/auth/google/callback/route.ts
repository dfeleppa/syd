import { NextRequest, NextResponse } from "next/server";

import { cookieName, isEmailAllowed, signSession } from "../../../../../lib/auth";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const next = url.searchParams.get("state") || "/";

  if (error) {
    console.error("Google OAuth error", error);
    return NextResponse.redirect(new URL("/auth/google", req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/google", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Missing Google OAuth env vars");
    return NextResponse.redirect(new URL("/auth/google", req.url));
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      console.error("Failed to exchange code for tokens", await res.text());
      return NextResponse.redirect(new URL("/auth/google", req.url));
    }

    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
      token_type?: string;
      id_token?: string;
    };

    // id_token is present when scopes include openid
    if (!json.id_token) {
      console.error("Google OAuth: missing id_token (ensure openid/email/profile scopes)");
      return NextResponse.redirect(new URL("/auth/google", req.url));
    }

    const parts = json.id_token.split(".");
    if (parts.length < 2) {
      console.error("Google OAuth: invalid id_token");
      return NextResponse.redirect(new URL("/auth/google", req.url));
    }

    // JWT parts are base64url encoded (NOT plain base64)
    let payload: { sub?: string; email?: string; name?: string };
    try {
      const payloadRaw = Buffer.from(parts[1], "base64url").toString("utf8");
      payload = JSON.parse(payloadRaw);
    } catch (e) {
      console.error("Google OAuth: failed to decode id_token payload", e);
      return NextResponse.redirect(new URL("/auth/google", req.url));
    }

    if (!payload.sub || !payload.email) {
      console.error("Google OAuth: id_token missing sub/email");
      return NextResponse.redirect(new URL("/auth/google", req.url));
    }

    if (!isEmailAllowed(payload.email)) {
      console.error("Google OAuth: email not allowed", payload.email);
      return NextResponse.redirect(new URL("/auth/google", req.url));
    }

    const sessionJwt = await signSession({ sub: payload.sub, email: payload.email, name: payload.name });

    const resp = NextResponse.redirect(new URL(next, req.url));
    resp.cookies.set(cookieName(), sessionJwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return resp;
  } catch (err) {
    console.error("Error during Google OAuth callback", err);
    return NextResponse.redirect(new URL("/auth/google", req.url));
  }
}
