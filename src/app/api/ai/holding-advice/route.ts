import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateHoldingAdvice } from "@/lib/ai-engine";
import { getCachedPrices } from "@/lib/price-cache";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { holdingId } = await req.json();

    if (!holdingId) {
      return NextResponse.json(
        { error: "holdingId is required" },
        { status: 400 }
      );
    }

    const holding = await prisma.stockHolding.findFirst({
      where: { id: holdingId, userId },
    });

    if (!holding) {
      return NextResponse.json(
        { error: "Holding not found" },
        { status: 404 }
      );
    }

    // Fetch live price
    const priceMap = await getCachedPrices([holding.symbol], userId);
    const currentPrice =
      priceMap.get(holding.symbol)?.price || holding.currentPrice || holding.buyPrice;
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

    // Get past trades for this symbol
    const pastTrades = await prisma.trade.findMany({
      where: { userId, symbol: holding.symbol, status: "CLOSED" },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

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
      userTradeHistory: pastTrades.map((t) => ({
        symbol: t.symbol,
        side: t.side,
        netPnl: t.netPnl || 0,
      })),
    });

    return NextResponse.json({
      holdingId,
      action: advice.action,
      reasoning: advice.reasoning,
      confidence: advice.confidence,
      currentPrice,
    });
  } catch (error) {
    console.error("Holding advice error:", error);
    return NextResponse.json(
      { error: "Failed to generate holding advice" },
      { status: 500 }
    );
  }
}
