import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(_req: NextRequest) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
  });

  const url = `${GOOGLE_AUTH_BASE}?${params.toString()}`;

  return NextResponse.json({ url });
}
