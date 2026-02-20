import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePortfolioAdvice } from "@/lib/ai-engine";
import { getCachedPrices } from "@/lib/price-cache";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const [holdings, funds, closedTrades] = await Promise.all([
      prisma.stockHolding.findMany({ where: { userId } }),
      prisma.mutualFund.findMany({ where: { userId } }),
      prisma.trade.findMany({
        where: { userId, status: "CLOSED" },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // Fetch live prices for holdings
    const symbols = [...new Set(holdings.map((h) => h.symbol))];
    const priceMap =
      symbols.length > 0 ? await getCachedPrices(symbols, userId) : new Map();

    const holdingsData = holdings.map((h) => {
      const currentPrice = priceMap.get(h.symbol)?.price || h.currentPrice || h.buyPrice;
      const investedValue = h.buyPrice * h.quantity;
      const currentValue = currentPrice * h.quantity;
      const pnlPct = investedValue > 0
        ? Math.round(((currentValue - investedValue) / investedValue) * 10000) / 100
        : 0;
      const holdingDays = Math.floor(
        (Date.now() - h.buyDate.getTime()) / 86400000
      );
      return {
        symbol: h.symbol,
        buyPrice: h.buyPrice,
        currentPrice,
        pnlPct,
        holdingDays,
      };
    });

    const fundsData = funds.map((f) => ({
      name: f.schemeName,
      category: f.category || "Unknown",
      returnPct: f.investedAmount > 0
        ? Math.round(((f.units * f.currentNav - f.investedAmount) / f.investedAmount) * 10000) / 100
        : 0,
      isSip: f.isSip,
    }));

    const winners = closedTrades.filter((t) => (t.netPnl || 0) > 0).length;
    const winRate = closedTrades.length > 0
      ? Math.round((winners / closedTrades.length) * 100)
      : 0;
    const totalPnl = closedTrades.reduce(
      (sum, t) => sum + (t.netPnl || 0),
      0
    );

    const totalPortfolioValue =
      holdingsData.reduce(
        (s, h) => s + h.currentPrice * (holdings.find((hh) => hh.symbol === h.symbol)?.quantity || 0),
        0
      ) +
      funds.reduce((s, f) => s + f.units * f.currentNav, 0);

    const advice = await generatePortfolioAdvice({
      holdings: holdingsData,
      mutualFunds: fundsData,
      intradayStats: {
        winRate,
        totalPnl: Math.round(totalPnl),
        tradeCount: closedTrades.length,
      },
      totalPortfolioValue: Math.round(totalPortfolioValue),
    });

    return NextResponse.json({ advice });
  } catch (error) {
    console.error("Portfolio health error:", error);
    return NextResponse.json(
      { error: "Failed to generate portfolio advice" },
      { status: 500 }
    );
  }
}
