import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateHoldingAdvice } from "@/lib/ai-engine";
import { getCachedPrices } from "@/lib/price-cache";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const holdings = await prisma.stockHolding.findMany({
      where: { userId },
    });

    if (holdings.length === 0) {
      return NextResponse.json({ advice: [] });
    }

    // Fetch live prices for all holdings
    const symbols = [...new Set(holdings.map((h) => h.symbol))];
    const priceMap = await getCachedPrices(symbols, userId);

    // Get past trades for context
    const pastTrades = await prisma.trade.findMany({
      where: { userId, status: "CLOSED" },
      take: 30,
      orderBy: { createdAt: "desc" },
    });

    const results = await Promise.all(
      holdings.map(async (holding) => {
        const currentPrice =
          priceMap.get(holding.symbol)?.price ||
          holding.currentPrice ||
          holding.buyPrice;
        const investedValue = holding.buyPrice * holding.quantity;
        const currentValue = currentPrice * holding.quantity;
        const pnlPct =
          investedValue > 0
            ? Math.round(
                ((currentValue - investedValue) / investedValue) * 10000
              ) / 100
            : 0;
        const holdingDays = Math.floor(
          (Date.now() - holding.buyDate.getTime()) / 86400000
        );

        const symbolTrades = pastTrades.filter(
          (t) => t.symbol === holding.symbol
        );

        try {
          const advice = await generateHoldingAdvice({
            holding: {
              symbol: holding.symbol,
              buyPrice: holding.buyPrice,
              currentPrice,
              quantity: holding.quantity,
              pnlPct,
              holdingDays,
              notes: holding.notes || undefined,
            },
            userTradeHistory: symbolTrades.map((t) => ({
              symbol: t.symbol,
              side: t.side,
              netPnl: t.netPnl || 0,
            })),
          });

          return {
            holdingId: holding.id,
            action: advice.action,
            reasoning: advice.reasoning,
            confidence: advice.confidence,
            currentPrice,
          };
        } catch {
          return {
            holdingId: holding.id,
            action: "HOLD",
            reasoning: "Unable to analyze right now.",
            confidence: "LOW",
            currentPrice,
          };
        }
      })
    );

    return NextResponse.json({ advice: results });
  } catch (error) {
    console.error("Bulk holding advice error:", error);
    return NextResponse.json(
      { error: "Failed to generate bulk advice" },
      { status: 500 }
    );
  }
}
