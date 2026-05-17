import { getCurrentUser } from "@/lib/auth/session";
import { ChartPage } from "@/components/chart/chart-page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { symbol?: string } }) {
  const user = await getCurrentUser();
  const symbol = (searchParams.symbol ?? "BTCUSD").toUpperCase();
  return <ChartPage initialSymbol={symbol} isAuthed={Boolean(user)} />;
}
