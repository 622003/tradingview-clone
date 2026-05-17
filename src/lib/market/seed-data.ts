// Static list of symbols used to seed the database and power the
// "all symbols" listing in the screener / search.

export interface SeedSymbol {
  ticker: string;
  name: string;
  exchange: string;
  type: "stock" | "crypto" | "forex" | "index" | "commodity";
  sector?: string;
  industry?: string;
  country?: string;
  description?: string;
}

export const SEED_SYMBOLS: SeedSymbol[] = [
  // crypto
  { ticker: "BTCUSD", name: "Bitcoin / U.S. Dollar", exchange: "BINANCE", type: "crypto", description: "Bitcoin priced in U.S. Dollar." },
  { ticker: "ETHUSD", name: "Ethereum / U.S. Dollar", exchange: "BINANCE", type: "crypto", description: "Ether priced in U.S. Dollar." },
  { ticker: "SOLUSD", name: "Solana / U.S. Dollar", exchange: "BINANCE", type: "crypto", description: "Solana priced in U.S. Dollar." },
  { ticker: "XRPUSD", name: "Ripple / U.S. Dollar", exchange: "BINANCE", type: "crypto" },
  // stocks
  { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock", sector: "Technology", industry: "Consumer Electronics", country: "US" },
  { ticker: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "stock", sector: "Technology", industry: "Software", country: "US" },
  { ticker: "GOOGL", name: "Alphabet Inc. (Class A)", exchange: "NASDAQ", type: "stock", sector: "Communication Services", industry: "Internet", country: "US" },
  { ticker: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", type: "stock", sector: "Consumer Cyclical", industry: "Internet Retail", country: "US" },
  { ticker: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "stock", sector: "Technology", industry: "Semiconductors", country: "US" },
  { ticker: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", type: "stock", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "US" },
  { ticker: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ", type: "stock", sector: "Communication Services", industry: "Internet", country: "US" },
  // indices / ETFs
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE", type: "index", country: "US" },
  { ticker: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ", type: "index", country: "US" },
  { ticker: "DIA", name: "SPDR Dow Jones Industrial Average ETF", exchange: "NYSE", type: "index", country: "US" },
  // forex
  { ticker: "EURUSD", name: "Euro / U.S. Dollar", exchange: "FX", type: "forex" },
  { ticker: "GBPUSD", name: "British Pound / U.S. Dollar", exchange: "FX", type: "forex" },
  { ticker: "USDJPY", name: "U.S. Dollar / Japanese Yen", exchange: "FX", type: "forex" },
  // commodities
  { ticker: "XAUUSD", name: "Gold Spot / U.S. Dollar", exchange: "OANDA", type: "commodity" },
  { ticker: "WTI", name: "Crude Oil WTI Futures", exchange: "NYMEX", type: "commodity" },
];

export interface SeedNewsTemplate {
  title: string;
  summary: string;
  source: string;
  tickers?: string[];
}

export const SEED_NEWS: SeedNewsTemplate[] = [
  {
    title: "Bitcoin extends rally as ETF inflows hit fresh record",
    summary: "Spot Bitcoin ETFs took in over $1.2B this week, pushing the asset toward new highs while institutional allocations broaden.",
    source: "MarketWire",
    tickers: ["BTCUSD"],
  },
  {
    title: "Nvidia guidance lifts entire semiconductor sector",
    summary: "Stronger-than-expected data center demand boosts shares of AI infrastructure names across the board.",
    source: "Reuters",
    tickers: ["NVDA", "AAPL", "MSFT"],
  },
  {
    title: "Apple unveils next-gen on-device intelligence stack",
    summary: "Cupertino's keynote highlighted privacy-preserving AI features expected to ship with the next major OS update.",
    source: "Bloomberg",
    tickers: ["AAPL"],
  },
  {
    title: "Tesla deliveries top estimates as new Model refresh ramps",
    summary: "Quarterly deliveries beat consensus despite continued price competition across global EV markets.",
    source: "CNBC",
    tickers: ["TSLA"],
  },
  {
    title: "EURUSD whipsaws after dovish ECB minutes",
    summary: "Traders trimmed long-euro exposure as the central bank's account hinted at an extended easing cycle.",
    source: "FXStreet",
    tickers: ["EURUSD"],
  },
  {
    title: "Gold steadies near record as real yields ease",
    summary: "Bullion holds gains as softer Treasury yields and persistent geopolitical risk underpin haven demand.",
    source: "Kitco",
    tickers: ["XAUUSD"],
  },
  {
    title: "Crude rebounds on tighter OPEC supply outlook",
    summary: "WTI moves higher after the latest monthly report flags falling inventories into year-end.",
    source: "OilPrice",
    tickers: ["WTI"],
  },
  {
    title: "S&P 500 closes at fresh high as breadth improves",
    summary: "Cyclicals lead the tape as rotation into industrials and financials accelerates.",
    source: "WSJ",
    tickers: ["SPY", "DIA"],
  },
];

export interface SeedIdeaTemplate {
  title: string;
  content: string;
  bias: "long" | "short" | "neutral" | "educational";
  ticker?: string;
  target?: number;
  stop?: number;
}

export const SEED_IDEAS: SeedIdeaTemplate[] = [
  {
    title: "BTCUSD — Continuation higher above $68k pivot",
    content: "Price is consolidating just under the prior swing high with rising lows. A daily close above 68,000 opens the path toward 72,500 with invalidation under 64,500.",
    bias: "long",
    ticker: "BTCUSD",
    target: 72500,
    stop: 64500,
  },
  {
    title: "NVDA — Mean reversion setup into earnings",
    content: "After an extended rally, RSI shows multi-month bearish divergence. Considering a short-term fade toward the 20-day MA before resuming the longer trend.",
    bias: "short",
    ticker: "NVDA",
    target: 128,
    stop: 152,
  },
  {
    title: "Risk management: position sizing 101",
    content: "A short walkthrough of fixed-fractional sizing, ATR-based stops, and why R-multiples matter more than win-rate.",
    bias: "educational",
  },
  {
    title: "EURUSD — Range trade around 1.08",
    content: "Watching for a clean break of the 1.0820 ceiling or the 1.0740 floor before committing capital. Inside the range we stay flat.",
    bias: "neutral",
    ticker: "EURUSD",
  },
  {
    title: "SPY — Trend-following pullback buy",
    content: "Daily trend remains up. Looking to add on dips into the rising 50-day moving average with a trailing ATR stop.",
    bias: "long",
    ticker: "SPY",
    target: 600,
    stop: 565,
  },
];
