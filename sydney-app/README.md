# sydney-app

Web UI for DanielOS.

## Source of truth

**Postgres + `danielos-server` is the source of truth.**

This app intentionally does **not** use local JSON files as a database anymore.
Legacy files (kept only as backup) are in `legacy-json/`.

## Environment

Create `.env.local` (do not commit) with:

```bash
DANIELOS_SERVER_URL=https://daniels-mac-mini.tail166065.ts.net/
DANIELOS_API_TOKEN=REPLACE_ME
```

Notes:
- The Next route handlers under `app/api/*` act as a **server-side proxy** to `danielos-server`.
- Keeping the token server-side prevents exposing it to the browser.

## Dev

```bash
npm install
npm run dev
```

Then open:
- http://localhost:3000/
- http://localhost:3000/planner
- http://localhost:3000/nutrition
