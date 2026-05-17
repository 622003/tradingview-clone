import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_SYMBOLS, SEED_NEWS, SEED_IDEAS } from "../src/lib/market/seed-data";
import { generateCandles, type Interval } from "../src/lib/market/simulator";

const prisma = new PrismaClient();

const INTERVALS: { interval: Interval; count: number }[] = [
  { interval: "1d", count: 365 },
  { interval: "1h", count: 24 * 14 },
  { interval: "15m", count: 4 * 24 * 5 },
  { interval: "5m", count: 12 * 24 * 2 },
  { interval: "1m", count: 60 * 8 },
  { interval: "4h", count: 6 * 60 },
  { interval: "1w", count: 52 },
];

async function main() {
  console.log("→ seeding users…");
  const adminHash = await bcrypt.hash("admin1234", 10);
  const userHash = await bcrypt.hash("user1234", 10);
  const proHash = await bcrypt.hash("pro1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@tradingclone.local" },
    update: {},
    create: {
      email: "admin@tradingclone.local",
      username: "admin",
      passwordHash: adminHash,
      displayName: "Admin",
      role: "ADMIN",
      status: "ACTIVE",
      maxAlerts: 1000,
      maxWatchlists: 100,
      canPostIdeas: true,
      canUseScreener: true,
      canExportData: true,
      bio: "Default administrator account.",
    },
  });

  const trader = await prisma.user.upsert({
    where: { email: "trader@tradingclone.local" },
    update: {},
    create: {
      email: "trader@tradingclone.local",
      username: "trader",
      passwordHash: userHash,
      displayName: "Sample Trader",
      role: "USER",
      status: "ACTIVE",
      bio: "Long-term equity + crypto.",
    },
  });

  const pro = await prisma.user.upsert({
    where: { email: "pro@tradingclone.local" },
    update: {},
    create: {
      email: "pro@tradingclone.local",
      username: "pro",
      passwordHash: proHash,
      displayName: "Pro Trader",
      role: "PRO",
      status: "ACTIVE",
      maxAlerts: 200,
      maxWatchlists: 25,
      canExportData: true,
      bio: "Active intraday trader.",
    },
  });

  console.log("→ seeding symbols…");
  for (const s of SEED_SYMBOLS) {
    await prisma.symbol.upsert({
      where: { ticker: s.ticker },
      update: {
        name: s.name,
        exchange: s.exchange,
        type: s.type,
        sector: s.sector,
        industry: s.industry,
        country: s.country,
        description: s.description,
      },
      create: {
        ticker: s.ticker,
        name: s.name,
        exchange: s.exchange,
        type: s.type,
        sector: s.sector,
        industry: s.industry,
        country: s.country,
        description: s.description,
      },
    });
  }

  console.log("→ seeding candles…");
  for (const s of SEED_SYMBOLS) {
    const sym = await prisma.symbol.findUniqueOrThrow({ where: { ticker: s.ticker } });
    for (const { interval, count } of INTERVALS) {
      const candles = generateCandles(s.ticker, interval, count);
      // wipe + recreate for this interval so reseeding stays deterministic
      await prisma.candle.deleteMany({ where: { symbolId: sym.id, interval } });
      await prisma.candle.createMany({
        data: candles.map((c) => ({
          symbolId: sym.id,
          interval,
          time: new Date(c.time * 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        })),
      });
    }
  }

  console.log("→ seeding watchlists…");
  // default watchlist for trader
  const wl = await prisma.watchlist.upsert({
    where: { id: `seed-wl-${trader.id}` },
    update: {},
    create: {
      id: `seed-wl-${trader.id}`,
      userId: trader.id,
      name: "My Watchlist",
      isDefault: true,
    },
  });
  const watchTickers = ["BTCUSD", "ETHUSD", "AAPL", "NVDA", "TSLA", "SPY", "EURUSD", "XAUUSD"];
  for (let i = 0; i < watchTickers.length; i++) {
    const sym = await prisma.symbol.findUnique({ where: { ticker: watchTickers[i] } });
    if (!sym) continue;
    await prisma.watchlistItem.upsert({
      where: { watchlistId_symbolId: { watchlistId: wl.id, symbolId: sym.id } },
      update: { position: i },
      create: { watchlistId: wl.id, symbolId: sym.id, position: i },
    });
  }

  // a Pro watchlist with crypto focus
  const wl2 = await prisma.watchlist.upsert({
    where: { id: `seed-wl-${pro.id}` },
    update: {},
    create: {
      id: `seed-wl-${pro.id}`,
      userId: pro.id,
      name: "Crypto Majors",
      isDefault: true,
    },
  });
  const cryptoTickers = ["BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD"];
  for (let i = 0; i < cryptoTickers.length; i++) {
    const sym = await prisma.symbol.findUnique({ where: { ticker: cryptoTickers[i] } });
    if (!sym) continue;
    await prisma.watchlistItem.upsert({
      where: { watchlistId_symbolId: { watchlistId: wl2.id, symbolId: sym.id } },
      update: { position: i },
      create: { watchlistId: wl2.id, symbolId: sym.id, position: i },
    });
  }

  console.log("→ seeding news…");
  await prisma.newsItem.deleteMany({});
  const now = Date.now();
  for (let i = 0; i < SEED_NEWS.length; i++) {
    const n = SEED_NEWS[i];
    const sym = n.tickers?.[0] ? await prisma.symbol.findUnique({ where: { ticker: n.tickers[0] } }) : null;
    await prisma.newsItem.create({
      data: {
        title: n.title,
        summary: n.summary,
        source: n.source,
        publishedAt: new Date(now - i * 1000 * 60 * 90),
        symbolId: sym?.id ?? null,
      },
    });
  }

  console.log("→ seeding ideas…");
  await prisma.idea.deleteMany({});
  for (let i = 0; i < SEED_IDEAS.length; i++) {
    const idea = SEED_IDEAS[i];
    const sym = idea.ticker ? await prisma.symbol.findUnique({ where: { ticker: idea.ticker } }) : null;
    const authorId = i % 2 === 0 ? trader.id : pro.id;
    await prisma.idea.create({
      data: {
        userId: authorId,
        symbolId: sym?.id ?? null,
        title: idea.title,
        content: idea.content,
        bias: idea.bias,
        target: idea.target,
        stop: idea.stop,
      },
    });
  }

  console.log("→ seeding feature flags & app settings…");
  const flags = [
    { key: "screener.enabled", description: "Toggle screener feature globally" },
    { key: "ideas.enabled", description: "Toggle community ideas globally" },
    { key: "alerts.enabled", description: "Toggle alerts globally" },
    { key: "registration.open", description: "Allow new user registration" },
  ];
  for (const f of flags) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      update: {},
      create: { key: f.key, description: f.description, enabled: true },
    });
  }

  const settings = [
    { key: "site.name", value: "TradeView" },
    { key: "site.tagline", value: "Charts, ideas, and screening — all in one" },
    { key: "site.theme", value: "dark" },
  ];
  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

  // Sample alert
  const btc = await prisma.symbol.findUnique({ where: { ticker: "BTCUSD" } });
  if (btc) {
    await prisma.alert.deleteMany({ where: { userId: trader.id } });
    await prisma.alert.create({
      data: {
        userId: trader.id,
        symbolId: btc.id,
        condition: "PRICE_ABOVE",
        value: 70000,
        status: "active",
        message: "BTC over 70k",
      },
    });
  }

  console.log("✓ Seed complete.");
  console.log("");
  console.log("Demo accounts:");
  console.log("  admin@tradingclone.local  / admin1234   (ADMIN)");
  console.log("  pro@tradingclone.local    / pro1234     (PRO)");
  console.log("  trader@tradingclone.local / user1234    (USER)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
