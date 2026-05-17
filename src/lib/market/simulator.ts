// Deterministic OHLCV simulator. Given a ticker and interval, generates
// a candle series using a seeded random walk so the same ticker always
// produces a stable history. Used to seed Prisma and to power /api/candles.

export type Interval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const INTERVAL_SECONDS: Record<Interval, number> = {
  "1m": 60,
  "5m": 5 * 60,
  "15m": 15 * 60,
  "1h": 60 * 60,
  "4h": 4 * 60 * 60,
  "1d": 24 * 60 * 60,
  "1w": 7 * 24 * 60 * 60,
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimulatorOptions {
  basePrice?: number;
  volatility?: number; // daily stdev as fraction of price
  drift?: number; // mean daily drift as fraction of price
}

const TICKER_PRESETS: Record<string, SimulatorOptions> = {
  BTCUSD: { basePrice: 67500, volatility: 0.035, drift: 0.0005 },
  ETHUSD: { basePrice: 3500, volatility: 0.045, drift: 0.0004 },
  SOLUSD: { basePrice: 165, volatility: 0.06, drift: 0.0005 },
  XRPUSD: { basePrice: 0.58, volatility: 0.05, drift: 0.0 },
  AAPL: { basePrice: 225, volatility: 0.015, drift: 0.0003 },
  MSFT: { basePrice: 420, volatility: 0.014, drift: 0.0003 },
  GOOGL: { basePrice: 170, volatility: 0.017, drift: 0.0003 },
  AMZN: { basePrice: 185, volatility: 0.018, drift: 0.0003 },
  NVDA: { basePrice: 140, volatility: 0.03, drift: 0.0006 },
  TSLA: { basePrice: 240, volatility: 0.035, drift: 0.0002 },
  META: { basePrice: 540, volatility: 0.022, drift: 0.0004 },
  SPY: { basePrice: 580, volatility: 0.01, drift: 0.0002 },
  QQQ: { basePrice: 500, volatility: 0.013, drift: 0.0003 },
  DIA: { basePrice: 430, volatility: 0.009, drift: 0.0002 },
  EURUSD: { basePrice: 1.08, volatility: 0.005, drift: 0 },
  GBPUSD: { basePrice: 1.27, volatility: 0.006, drift: 0 },
  USDJPY: { basePrice: 152.5, volatility: 0.006, drift: 0 },
  XAUUSD: { basePrice: 2620, volatility: 0.012, drift: 0.0003 },
  WTI: { basePrice: 78, volatility: 0.02, drift: 0 },
};

export function presetFor(ticker: string): SimulatorOptions {
  return TICKER_PRESETS[ticker] ?? { basePrice: 100, volatility: 0.02, drift: 0.0001 };
}

export function generateCandles(
  ticker: string,
  interval: Interval,
  count: number,
  endTime: number = Math.floor(Date.now() / 1000),
  opts: SimulatorOptions = {},
): Candle[] {
  const preset = { ...presetFor(ticker), ...opts };
  const basePrice = preset.basePrice ?? 100;
  const dailyVol = preset.volatility ?? 0.02;
  const dailyDrift = preset.drift ?? 0;
  const stepSec = INTERVAL_SECONDS[interval];
  const stepsPerDay = (24 * 3600) / stepSec;
  const sigma = dailyVol / Math.sqrt(stepsPerDay);
  const mu = dailyDrift / stepsPerDay;

  const rng = mulberry32(hashSeed(`${ticker}|${interval}`));
  // align the most recent bar to a clean interval boundary
  const alignedEnd = Math.floor(endTime / stepSec) * stepSec;

  const candles: Candle[] = [];
  // walk forward from start so the random sequence is stable
  const startTime = alignedEnd - (count - 1) * stepSec;
  let price = basePrice;
  // pre-walk backwards from now using the seeded rng to avoid drift bias
  for (let i = 0; i < count; i++) {
    const t = startTime + i * stepSec;
    const r1 = rng();
    const r2 = rng();
    // Box-Muller for normal sample
    const z = Math.sqrt(-2 * Math.log(Math.max(r1, 1e-9))) * Math.cos(2 * Math.PI * r2);
    const ret = mu + sigma * z;
    const open = price;
    const close = Math.max(open * (1 + ret), 1e-6);
    const span = Math.abs(close - open) + open * sigma * (0.4 + rng() * 0.6);
    const high = Math.max(open, close) + span * rng();
    const low = Math.min(open, close) - span * rng();
    const volume =
      basePrice > 1000
        ? 20000 + rng() * 200000
        : basePrice > 10
          ? 1_000_000 + rng() * 5_000_000
          : 50_000_000 + rng() * 200_000_000;
    candles.push({
      time: t,
      open: round(open),
      high: round(Math.max(low, high)),
      low: round(Math.min(low, high)),
      close: round(close),
      volume: Math.round(volume),
    });
    price = close;
  }
  return candles;
}

function round(v: number): number {
  if (v >= 1000) return Math.round(v * 100) / 100;
  if (v >= 10) return Math.round(v * 1000) / 1000;
  return Math.round(v * 10000) / 10000;
}

export function priceQuote(ticker: string, at: number = Math.floor(Date.now() / 1000)) {
  const oneDay = generateCandles(ticker, "1d", 2, at);
  const prev = oneDay[0];
  const cur = oneDay[1] ?? prev;
  const change = cur.close - prev.close;
  const pct = (change / prev.close) * 100;
  return {
    ticker,
    price: cur.close,
    open: cur.open,
    high: cur.high,
    low: cur.low,
    prevClose: prev.close,
    change,
    changePct: pct,
    volume: cur.volume,
    time: cur.time,
  };
}
