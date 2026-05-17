# CLAUDE.md — onboarding for Claude Code (and humans)

This file is the **first** thing you read when you open the repo in Claude Code.
It tells you what the project is, where everything lives, and exactly which
files to touch for the most common changes. Keep it short — when something here
gets stale, fix it.

---

## 1. What this project is

A TradingView-style trading dashboard served as **two distinct websites from a
single Next.js codebase**:

| Site  | Dev URL                      | Prod URL                        | What it serves                                         |
| ----- | ---------------------------- | ------------------------------- | ------------------------------------------------------ |
| User  | `http://app.lvh.me:3000`     | `https://app.<your-domain>`     | Chart, watchlist, alerts, ideas, screener, news, etc.  |
| Admin | `http://admin.lvh.me:3000`   | `https://admin.<your-domain>`   | User mgmt, symbol catalog, idea moderation, audit log. |

Same database. Same auth. The two hostnames are routed apart in
`src/middleware.ts`. The session cookie is scoped to the parent domain
(`.lvh.me` in dev, `.<your-domain>` in prod) so one sign-in covers both sites.

> `lvh.me` is a public DNS service that resolves `*.lvh.me` → `127.0.0.1`. You
> don't need to edit `/etc/hosts`.

---

## 2. Quickstart

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Then open:

- User:  http://app.lvh.me:3000
- Admin: http://admin.lvh.me:3000  (sign in as `admin` / `admin1234`)

Demo accounts: `admin`/`admin1234`, `pro`/`pro1234`, `trader`/`user1234`.

---

## 3. Tech stack

- **Next.js 14** App Router + TypeScript + Tailwind
- **Prisma** + **SQLite** (dev) / **Postgres** (prod — flip provider + `DATABASE_URL`)
- **Custom session auth** in `src/lib/auth/session.ts` (NOT NextAuth)
- **`lightweight-charts`** for the candlestick chart
- **Deterministic market simulator** in `src/lib/market/simulator.ts` — no
  external data feed, no API keys

---

## 4. Repo map

```
src/
├── middleware.ts              ← Host-based routing (USER vs ADMIN site)
├── app/
│   ├── (public)/              ← Marketing pages, served on USER site
│   ├── (app)/                 ← Authed pages (chart, watchlist, …) on USER site
│   ├── (auth)/                ← /login, /register (served on both sites)
│   ├── admin/                 ← Admin pages, served on ADMIN site only
│   └── api/
│       ├── auth/              ← login, register, logout (rate-limited)
│       ├── admin/             ← admin-only endpoints
│       ├── health/            ← liveness probe used by load balancers
│       └── …
├── components/
│   ├── layout/                ← AppShell, Sidebar, Header (take `site` prop)
│   ├── chart/                 ← ChartView, ChartPage
│   └── ui/                    ← shadcn-style primitives — compose, don't rebuild
└── lib/
    ├── env.ts                 ← Zod env validation, single source of truth
    ├── hosts.ts               ← siteFromHost / userSiteUrl / adminSiteUrl
    ├── rate-limit.ts          ← In-process sliding-window limiter
    ├── auth/session.ts        ← getCurrentUser, requireUser, requireAdmin
    ├── api.ts                 ← ok() / handleError() / parseJson()
    ├── market/simulator.ts    ← generateCandles, priceQuote
    ├── indicators/index.ts    ← sma/ema/rsi/macd/bollinger/vwap
    └── admin/audit.ts         ← recordAudit + feature flags

prisma/
├── schema.prisma              ← Single schema file. Migrations checked in.
└── migrations/
```

---

## 5. The two-site model — what you need to know

1. **Routing happens in `src/middleware.ts`**, which reads the `Host` header:
   - On the admin host (`admin.lvh.me`) only `/admin/**`, `/login`, `/api/auth/**`,
     and `/api/health` are allowed. Everything else 302s to the user host.
   - On the user host (`app.lvh.me`) any `/admin/**` URL 302s to the admin host.
2. **`src/app/admin/layout.tsx`** rejects non-ADMIN users and cross-host redirects
   them to the user app. Don't add admin-only logic anywhere else — let the layout
   do it.
3. **`AppShell`** (`src/components/layout/app-shell.tsx`) takes a `site` prop
   (`"user" | "admin"`). The Sidebar and Header read it to pick navigation,
   colors, and which "switch to the other site" link to render.
4. **`src/lib/hosts.ts`** is the only place that knows how to build a URL for
   the other site. Use `userSiteUrl("/chart")` / `adminSiteUrl("/admin")` — never
   hardcode hostnames.
5. **The session cookie is shared.** It's set on `COOKIE_DOMAIN` (`.lvh.me` /
   `.<your-domain>`), so signing in on one site signs you into the other.

---

## 6. Conventions (don't break these)

### File organization
- Pages: `src/app/<group>/<route>/page.tsx`.
- API: `src/app/api/<route>/route.ts` exporting `GET`/`POST`/etc.
- Cross-cutting logic: `src/lib/<domain>/`.
- Imports use the `@/` alias and always go at the top of the file.

### Server vs client
- Server Components by default. Sprinkle `"use client"` only when you need
  React state, effects, or browser-only APIs.
- Server components read directly from Prisma; client components fetch via `/api/*`.

### API response envelope
Every route returns `{ ok: true, data }` or `{ ok: false, error: { code, message } }`
via helpers in `src/lib/api.ts`:

```ts
import { ok, handleError, parseJson } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = parseJson(MySchema, await req.json());
    // ...
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
```

### Dynamic API routes
Routes that read query strings must opt out of static rendering:

```ts
export const dynamic = "force-dynamic";
```

### Styling
- Tailwind utility classes only. No arbitrary values (`h-[600px]`) — use the
  spacing scale.
- Dark theme only for now (`zinc-950` bg, `zinc-100` text).
- User site accent = `blue-*` / `emerald-*`. Admin site accent = `rose-*` / `amber-*`.

---

## 7. Common tasks — "where do I edit?"

### Add a new page on the user site
1. Create `src/app/(app)/<route>/page.tsx` (authed) or `src/app/(public)/<route>/page.tsx` (public).
2. Add a nav entry to `USER_NAV` in `src/components/layout/sidebar.tsx`.

### Add a new admin page
1. Create `src/app/admin/<route>/page.tsx`.
2. Add a nav entry to `ADMIN_NAV` in `src/components/layout/sidebar.tsx`.
3. The admin layout already gates this on `role === "ADMIN"`.

### Add a new API endpoint
1. Create `src/app/api/<route>/route.ts`.
2. Use `parseJson(Schema, await req.json())` for validation.
3. Use `requireUser()` or `requireAdmin()` for auth.
4. Return `ok(data)` or `handleError(e)`.
5. If you read query params, add `export const dynamic = "force-dynamic"`.

### Add a new technical indicator
1. Add a pure function in `src/lib/indicators/index.ts` (input `number[]`).
2. Add a boolean to `IndicatorConfig` in `src/components/chart/chart-view.tsx`
   and render it in the main `useEffect`.
3. Add a `<SelectItem>` in `ChartPage` (`src/components/chart/chart-page.tsx`).

### Add a new admin permission toggle
1. Add a column on `User` in `prisma/schema.prisma`.
2. `npx prisma migrate dev --name <descriptive-name>`.
3. Expose it in the `PATCH /api/admin/users/[id]` Zod schema.
4. Add a toggle to `src/app/admin/users/[id]/page.tsx`.
5. Surface it on the user's Profile page.
6. Check it in the relevant endpoint(s).

### Plug in a real market-data provider
Replace **just** these two functions — every consumer goes through them:
- `generateCandles()` in `src/lib/market/simulator.ts`
- `priceQuote()` in `src/lib/market/simulator.ts`

### Add a new feature flag
1. Call `getFlag("my.flag", false)` wherever you need it.
2. Admins can flip it from `/admin/settings`.

### Add a new environment variable
1. Add it to the Zod schema in `src/lib/env.ts`.
2. Document it in `.env.example`.
3. Import it via `import { env } from "@/lib/env"` — **never** read
   `process.env.MY_VAR` directly outside `env.ts`.

---

## 8. Auth + sessions

- Sessions are random opaque tokens stored in the `Session` table and an
  `HttpOnly` cookie scoped to `COOKIE_DOMAIN`.
- `getCurrentUser()` resolves the user, refreshes `lastLoginAt`, and rejects
  `BANNED` / `SUSPENDED` accounts.
- `requireUser()` / `requireAdmin()` are the gatekeepers for API routes.
- Rate limits are applied to `/api/auth/login` (10 / 5 min / IP) and
  `/api/auth/register` (5 / hour / IP) via `src/lib/rate-limit.ts`.

---

## 9. Deployment

Two paths, both documented in [`README.md`](./README.md):

### Docker (single-machine, local or VPS)
```bash
docker compose up --build
```
Then visit `http://app.localhost` and `http://admin.localhost`. Caddy in front
proxies both hostnames to the same Next.js container.

### Vercel / Railway / Fly.io
1. Deploy one Next.js instance.
2. Point two hostnames at it (DNS A/CNAME records).
3. Set `USER_HOST`, `ADMIN_HOST`, `COOKIE_DOMAIN`, `DATABASE_URL` env vars.
4. `npx prisma migrate deploy` on every release.

Health check endpoint: `GET /api/health` returns `{ ok: true, status: "healthy" }`
when the DB is reachable.

---

## 10. Gotchas

- **Don't shadow globals** with React state setters (we renamed `setInterval`
  to `setIntervalValue` in `chart-page.tsx` for exactly this reason).
- **Wrap `useSearchParams()`** in `<Suspense>` in client pages (see `LoginPage`).
- **API routes that read query strings** need `export const dynamic = "force-dynamic"`.
- **Migrations are checked in.** After editing `schema.prisma`, always run
  `npx prisma migrate dev` and commit the SQL.
- **Don't read `process.env.*` directly** outside `src/lib/env.ts`. Add the var
  to the Zod schema and import `env` instead.
- **Don't hardcode `app.lvh.me` / `admin.lvh.me`**. Use the helpers in
  `src/lib/hosts.ts`.
- **Banned users can still hold a valid session cookie**; `getCurrentUser()`
  rejects them anyway, but if you add a new auth helper, check `user.status`.

---

## 11. When in doubt

1. Read `src/lib/api.ts` + `src/lib/auth/session.ts` + `src/middleware.ts`.
   Those three files explain how the rest of the app composes.
2. Grep for an existing feature similar to yours. Ideas is wired end-to-end
   (schema → seed → API → page → admin moderation) — copy that shape.
3. `npx prisma studio` opens a browser UI on the live DB.

Happy hacking.
