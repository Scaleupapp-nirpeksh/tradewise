import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCachedPrices } from "@/lib/price-cache";
import { OpenPositionWithLive } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const openTrades = await prisma.trade.findMany({
    where: { userId, status: "OPEN" },
    include: { strategy: true },
    orderBy: { createdAt: "desc" },
  });

  if (openTrades.length === 0) {
    return NextResponse.json({ positions: [], totalUnrealizedPnl: 0 });
  }

  // Get unique symbols and fetch cached prices
  const symbols = [...new Set(openTrades.map((t) => t.symbol))];
  console.log("[Positions] Fetching prices for symbols:", symbols);
  const prices = await getCachedPrices(symbols, userId);
  console.log("[Positions] Price cache returned:", symbols.map((s) => {
    const p = prices.get(s);
    return p ? `${s}=₹${p.price} (source: ${p.source}, age: ${Math.round((Date.now() - p.updatedAt.getTime()) / 1000)}s)` : `${s}=NO DATA`;
  }));

  let totalUnrealizedPnl = 0;

  const positions: OpenPositionWithLive[] = openTrades.map((trade) => {
    const priceData = prices.get(trade.symbol);
    const currentPrice = priceData?.price || trade.entryPrice;
    if (!priceData) {
      console.warn(`[Positions] NO PRICE for ${trade.symbol} — using entry price ₹${trade.entryPrice}`);
    }

    const unrealizedPnl =
      trade.side === "BUY"
        ? (currentPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - currentPrice) * trade.quantity;

    const unrealizedPnlPct =
      trade.entryPrice > 0
        ? ((currentPrice - trade.entryPrice) / trade.entryPrice) *
          100 *
          (trade.side === "BUY" ? 1 : -1)
        : 0;

    const distanceToTarget =
      trade.targetPrice && trade.targetPrice > 0
        ? ((trade.targetPrice - currentPrice) / currentPrice) * 100
        : null;

    const distanceToStopLoss =
      trade.stopLossPrice && trade.stopLossPrice > 0
        ? ((currentPrice - trade.stopLossPrice) / currentPrice) * 100
        : null;

    totalUnrealizedPnl += unrealizedPnl;

    return {
      id: trade.id,
      symbol: trade.symbol,
      exchange: trade.exchange,
      side: trade.side as "BUY" | "SELL",
      quantity: trade.quantity,
      entryPrice: trade.entryPrice,
      entryTime: trade.entryTime.toISOString(),
      targetPrice: trade.targetPrice,
      stopLossPrice: trade.stopLossPrice,
      strategyName: trade.strategy?.name || null,
      currentPrice,
      unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      unrealizedPnlPct: Math.round(unrealizedPnlPct * 100) / 100,
      distanceToTarget: distanceToTarget
        ? Math.round(distanceToTarget * 100) / 100
        : null,
      distanceToStopLoss: distanceToStopLoss
        ? Math.round(distanceToStopLoss * 100) / 100
        : null,
    };
  });

  return NextResponse.json({
    positions,
    totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
  });
}
