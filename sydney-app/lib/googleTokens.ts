import fs from "fs";
import path from "path";

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number; // epoch ms
  scope?: string;
  tokenType?: string;
}

const TOKENS_PATH = process.env.GOOGLE_TOKENS_PATH
  ? path.resolve(process.env.GOOGLE_TOKENS_PATH)
  : path.join(process.cwd(), ".data", "google-tokens.json");

function ensureDirExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readGoogleTokens(): GoogleTokens | null {
  try {
    const raw = fs.readFileSync(TOKENS_PATH, "utf8");
    const parsed = JSON.parse(raw) as GoogleTokens;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiryDate) {
      return null;
    }
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    console.error("Failed to read Google tokens", err);
    return null;
  }
}

export function writeGoogleTokens(tokens: GoogleTokens): void {
  ensureDirExists(TOKENS_PATH);
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf8");
}

export function hasValidAccessToken(): boolean {
  const tokens = readGoogleTokens();
  if (!tokens) return false;
  const now = Date.now();
  // consider token expired a little early to account for clock skew
  return tokens.expiryDate - now > 60_000;
}
