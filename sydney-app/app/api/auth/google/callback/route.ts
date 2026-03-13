import { NextRequest, NextResponse } from "next/server";
import { writeGoogleTokens, GoogleTokens } from "../../../../../lib/googleTokens";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("Google OAuth error", error);
    return NextResponse.redirect("/calendar");
  }

  if (!code) {
    return NextResponse.redirect("/calendar");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Missing Google OAuth env vars");
    return NextResponse.redirect("/calendar");
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
      return NextResponse.redirect("/calendar");
    }

    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
      token_type?: string;
    };

    const now = Date.now();
    const expiryDate = now + json.expires_in * 1000;

    const tokens: GoogleTokens = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token || "",
      expiryDate,
      scope: json.scope,
      tokenType: json.token_type,
    };

    if (!tokens.refreshToken) {
      console.warn("Google OAuth: no refresh_token returned; may need to revoke access and re-consent");
    }

    writeGoogleTokens(tokens);
  } catch (err) {
    console.error("Error during Google OAuth callback", err);
  }

  return NextResponse.redirect("/calendar");
}
