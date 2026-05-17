# TradeView — TradingView-style full-stack clone

An open-source TradingView clone built with **Next.js 14 (App Router), TypeScript, Prisma + SQLite,
Tailwind CSS and `lightweight-charts`**. Ships as **two distinct websites from one codebase**:

- **User site** — chart, watchlist, alerts, ideas, screener, news.
- **Admin site** — user management, symbol catalog, idea moderation, audit log, feature flags.

The two sites are served from different hostnames (e.g. `app.example.com` and
`admin.example.com`), share a single database and session cookie, and are routed
apart by `src/middleware.ts`. Same deployment, two products.

The project is intentionally structured so you can drop into [Claude Code](https://www.anthropic.com/claude-code)
or any other coding agent and continue building. See [`CLAUDE.md`](./CLAUDE.md) for an architecture
tour and contribution guide.

---

## Features

### Trading UI
- **Charting** powered by [`lightweight-charts`](https://github.com/tradingview/lightweight-charts)
  with candles, line and area chart types.
- Built-in **technical indicators**: EMA (20/50/200), Bollinger Bands, Volume, RSI(14) and MACD —
  RSI and MACD are rendered as synchronised sub-charts.
- Seven timeframes: `1m`, `5m`, `15m`, `1h`, `4h`, `1d`, `1w`.
- **Symbol search** command palette (`Cmd+K` / `Ctrl+K`).
- **Live quotes** auto-refresh every 5 seconds (driven by a deterministic seeded simulator —
  no external API or key required).
- **Watchlists** (multiple per user, with the first one being the default).
- **Alerts** (price above / price below / % change / volume above).
- **Markets** overview grouping crypto, stocks, forex, commodities and indices.
- **Screener** with type/exchange/price/% filters and sortable columns.
- **Ideas** — a lightweight social feed where authorised users publish trade ideas
  with bias, target and stop.
- **News** feed, both global and per-symbol.

### Auth & accounts
- Custom session-based auth (no NextAuth dependency) backed by HTTP-only cookies and
  `bcryptjs`-hashed passwords.
- Three demo accounts seeded for you. The login form accepts **either the
  username or the email**:

  | Username | Email                          | Password    | Role  |
  | -------- | ------------------------------ | ----------- | ----- |
  | `admin`  | `admin@tradingclone.local`     | `admin1234` | ADMIN |
  | `pro`    | `pro@tradingclone.local`       | `pro1234`   | PRO   |
  | `trader` | `trader@tradingclone.local`    | `user1234`  | USER  |

- Per-user feature limits and flags: `maxAlerts`, `maxWatchlists`, `canPostIdeas`,
  `canUseScreener`, `canExportData`.
- User statuses: `ACTIVE`, `SUSPENDED`, `BANNED` (banned users can't sign in or
  hit any authenticated endpoint).

### Admin panel (`/admin`)
- **Dashboard** — counts of users, symbols, alerts, ideas, news; recent user activity and admin audit log.
- **Users** — search/filter by role and status. Edit role, status, display name, bio,
  per-user limits & permissions. Revoke all sessions or delete the user entirely.
- **Symbols** — add or remove tickers from the universe.
- **Ideas moderation** — soft-delete inappropriate posts.
- **News** — publish news items globally or scoped to a ticker.
- **Audit log** — every admin action is recorded (actor / action / target) with details.
- **Feature flags** — toggle global features:
  `registration.open`, `ideas.enabled`, `screener.enabled`, `news.enabled`, `alerts.enabled`.

### Engineering goodies
- Deterministic, **seeded market simulator** (`src/lib/market/simulator.ts`) — same ticker
  always renders the same history, perfect for demos and screenshots.
- All API routes validated with [Zod](https://zod.dev/) (`src/lib/api.ts`).
- `prisma/schema.prisma` is the single source of truth — swap SQLite for Postgres
  by changing `provider` and `DATABASE_URL`.

---

## Quick start

```bash
# 1) Install deps
npm install

# 2) Copy env (defaults work locally on app.lvh.me / admin.lvh.me)
cp .env.example .env

# 3) Create the DB + apply migrations + seed demo data
npx prisma migrate dev --name init
npx prisma db seed

# 4) Run the dev server
npm run dev
```

Then open:

- **User site:**  http://app.lvh.me:3000
- **Admin site:** http://admin.lvh.me:3000 (sign in as `admin` / `admin1234`)

> `lvh.me` is a public DNS service that resolves `*.lvh.me` → `127.0.0.1`. You
> don't need to edit `/etc/hosts`, install anything, or run a reverse proxy in
> development — it just works.

If you sign in on one site, the session cookie is scoped to `.lvh.me` so the
other site is signed in too. Non-admin users that land on `admin.lvh.me:3000`
get redirected back to the user site automatically.

### npm scripts
```bash
npm run dev          # next dev
npm run build        # next build
npm run start        # next start
npm run lint         # next lint
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed
npm run db:reset     # prisma migrate reset (drops + reseeds)
npm run db:studio    # prisma studio
```

---

## Project layout

```
src/
  app/
    (auth)/        # /login, /register (no app shell)
    (public)/      # /chart, /markets, /news, /ideas, /screener, /symbols/[ticker]
    (app)/         # /watchlist, /alerts, /profile, /settings (auth required)
    admin/         # /admin/* (ADMIN role required)
    api/           # REST endpoints (auth, symbols, candles, watchlists,
                   #   alerts, ideas, news, screener, quotes, admin/*)
    globals.css
    layout.tsx
  components/
    chart/         # ChartView + ChartPage (lightweight-charts wrapper)
    layout/        # AppShell, Sidebar, Header, SearchDialog
    ui/            # shadcn-style primitives (Button, Input, Card, ...)
    watchlist/
  lib/
    auth/          # session.ts (cookie + bcrypt)
    market/        # simulator.ts (seeded RNG, candle generator)
    indicators/    # SMA / EMA / RSI / MACD / Bollinger / VWAP
    admin/         # recordAudit / recordActivity helpers
    api.ts         # zod validation + error helpers
    prisma.ts
    utils.ts
prisma/
  schema.prisma
  seed.ts          # demo users + 19 symbols + candles + watchlists + news + ideas
  migrations/
```

See [`CLAUDE.md`](./CLAUDE.md) for deeper architecture notes and a roadmap of suggested
next steps if you want to extend the project.

---

## How the two-site split works

| Concern        | Where it lives                                            |
| -------------- | --------------------------------------------------------- |
| Host detection | `src/middleware.ts` reads the `Host` header               |
| Env vars       | `USER_HOST`, `ADMIN_HOST`, `COOKIE_DOMAIN` (`src/lib/env.ts`) |
| URL building   | `userSiteUrl()` / `adminSiteUrl()` in `src/lib/hosts.ts`  |
| Shared cookie  | `src/lib/auth/session.ts` sets `domain = COOKIE_DOMAIN`   |
| UI shell       | `AppShell` takes a `site="user" | "admin"` prop           |

On the **admin host** the middleware only allows `/admin/**`, `/login`, `/api/auth/**`,
and `/api/health`. Any other URL 302s to the user host. On the **user host** any
`/admin/**` URL 302s to the admin host. This means accidental links always end up
on the right product.

`src/app/admin/layout.tsx` additionally bounces signed-in non-admin users back to
the user site, so the admin host is genuinely admin-only.

---

## Switching to Postgres

In `prisma/schema.prisma`, change the datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then re-run the migration:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/tradeview" \
  npx prisma migrate dev --name init && npx prisma db seed
```

---

## Production deployment

### Option A — Docker Compose (single VPS)

The repo ships with a complete two-host stack: Postgres + Next.js + Caddy
reverse proxy.

```bash
# Switch Prisma to Postgres first (one-time, see "Switching to Postgres" above).
docker compose up --build -d
```

Then open:

- http://app.localhost
- http://admin.localhost

For real domains, edit `Caddyfile`:

```caddy
app.example.com {
  reverse_proxy web:3000
}

admin.example.com {
  reverse_proxy web:3000
}
```

…and remove the `auto_https off` block. Caddy will obtain Let's Encrypt
certificates automatically on first request.

Set these env vars on the `web` service:

```yaml
USER_HOST: app.example.com
ADMIN_HOST: admin.example.com
COOKIE_DOMAIN: .example.com
DATABASE_URL: postgresql://...
SESSION_SECRET: <openssl rand -hex 32>
NODE_ENV: production
```

### Option B — Vercel / Railway / Fly.io

1. Deploy a single Next.js instance.
2. Add two custom domains pointing at the same deployment (e.g.
   `app.example.com` and `admin.example.com`).
3. Set env vars: `USER_HOST`, `ADMIN_HOST`, `COOKIE_DOMAIN`, `DATABASE_URL`,
   `SESSION_SECRET`, `NODE_ENV=production`.
4. Run `npx prisma migrate deploy` on every release (most platforms support a
   post-deploy hook for this; Vercel users can wire it as a build step).
5. Hit `GET /api/health` from your monitoring — it returns 200 when the DB is
   reachable and 503 otherwise.

### Health checks & rate limits

- `GET /api/health` — liveness probe. Returns `{ ok: true, status: "healthy" }`
  when Prisma can reach the DB.
- `/api/auth/login` is rate-limited to **10 requests / 5 min / IP**.
- `/api/auth/register` is rate-limited to **5 requests / hour / IP**.

The limiter is in-process (`src/lib/rate-limit.ts`) and resets on restart.
Swap it for Redis if you run multiple instances.

---

## License

MIT — see [`LICENSE`](./LICENSE) (add your own license file if you plan to publish).
The bundled `lightweight-charts` library is Apache-2.0. Market data is **simulated**;
no real-time feed or third-party data is used.
