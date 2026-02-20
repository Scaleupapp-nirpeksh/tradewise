import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchStocks, POPULAR_NSE_STOCKS } from "@/lib/market-data";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query || query.length < 2) {
    // Return popular stocks as default suggestions
    return NextResponse.json({
      results: POPULAR_NSE_STOCKS.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        exchange: "NSE",
      })),
    });
  }

  const results = await searchStocks(query);

  // If API returns nothing, filter popular stocks locally
  if (results.length === 0) {
    const filtered = POPULAR_NSE_STOCKS.filter(
      (s) =>
        s.symbol.includes(query.toUpperCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    ).map((s) => ({ symbol: s.symbol, name: s.name, exchange: "NSE" }));
    return NextResponse.json({ results: filtered });
  }

  return NextResponse.json({ results });
}
