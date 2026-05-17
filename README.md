# TradeView — TradingView-style full-stack clone

An open-source TradingView clone built with **Next.js 14 (App Router), TypeScript, Prisma + SQLite,
Tailwind CSS and `lightweight-charts`**. Ships with a complete **admin panel** for managing users,
roles, permissions, symbols, ideas, news and global feature flags.

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

# 2) Copy env (defaults work locally)
cp .env.example .env

# 3) Create the DB + apply migrations + seed demo data
npx prisma migrate dev --name init
npx prisma db seed

# 4) Run the dev server
npm run dev
# -> http://localhost:3000
```

Sign in as **`admin` / `admin1234`** (or `admin@tradingclone.local`) to access `/admin`.

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

## License

MIT — see [`LICENSE`](./LICENSE) (add your own license file if you plan to publish).
The bundled `lightweight-charts` library is Apache-2.0. Market data is **simulated**;
no real-time feed or third-party data is used.
