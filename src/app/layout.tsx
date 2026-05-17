import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeView — Charts, Ideas, Screener",
  description:
    "An open TradingView-style clone built with Next.js + Prisma. Charts, watchlists, screener, alerts, ideas and a full admin panel.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
