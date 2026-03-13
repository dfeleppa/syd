import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI not configured" },
      { status: 500 }
    );
  }

  // We request OpenID scopes for login + calendar.readonly for future calendar features.
  const requestUrl = new URL(req.url);
  const next = requestUrl.searchParams.get("next") || "/";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    // We'll use the OAuth state to carry the post-login redirect.
    state: next,
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
  });

  const url = `${GOOGLE_AUTH_BASE}?${params.toString()}`;

  return NextResponse.json({ url });
}
