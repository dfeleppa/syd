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

    // Fetch user identity from UserInfo endpoint using the access token.
    // This works even if id_token is missing (some OAuth configs/scopes).
    const userinfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${json.access_token}`,
      },
    });

    if (!userinfoRes.ok) {
      console.error("Google OAuth: failed to fetch userinfo", await userinfoRes.text());
      return NextResponse.redirect(new URL("/auth/google", req.url));
    }

    const userinfo = (await userinfoRes.json()) as { sub?: string; email?: string; name?: string };

    if (!userinfo.sub || !userinfo.email) {
      console.error("Google OAuth: userinfo missing sub/email");
      return NextResponse.redirect(new URL("/auth/google", req.url));
    }

    if (!isEmailAllowed(userinfo.email)) {
      console.error("Google OAuth: email not allowed", userinfo.email);
      return NextResponse.redirect(new URL("/auth/google", req.url));
    }

    const sessionJwt = await signSession({ sub: userinfo.sub, email: userinfo.email, name: userinfo.name });

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
