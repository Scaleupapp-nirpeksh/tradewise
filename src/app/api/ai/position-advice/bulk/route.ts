import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCachedPrices } from "@/lib/price-cache";
import { generatePositionAdvice } from "@/lib/ai-engine";
import { PositionAdviceData } from "@/types";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const [openTrades, user] = await Promise.all([
    prisma.trade.findMany({
      where: { userId, status: "OPEN" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { capitalAmount: true, dailyLossLimit: true },
    }),
  ]);

  if (openTrades.length === 0) {
    return NextResponse.json({ advice: [] });
  }

  const symbols = [...new Set(openTrades.map((t) => t.symbol))];
  const prices = await getCachedPrices(symbols);

  // Get past trades for context
  const pastTrades = await prisma.trade.findMany({
    where: { userId, status: "CLOSED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      symbol: true,
      side: true,
      netPnl: true,
      emotionTag: true,
      entryTime: true,
      exitTime: true,
    },
  });

  const tradeHistory = pastTrades.map((t) => ({
    symbol: t.symbol,
    side: t.side,
    netPnl: t.netPnl || 0,
    emotionTag: t.emotionTag || undefined,
    holdDuration:
      t.exitTime && t.entryTime
        ? Math.round(
            (t.exitTime.getTime() - t.entryTime.getTime()) / 60000
          )
        : undefined,
  }));

  const results: (PositionAdviceData & { id: string })[] = [];

  // Process sequentially to avoid AI rate limits
  for (const trade of openTrades) {
    const priceData = prices.get(trade.symbol);
    const currentPrice = priceData?.price || trade.entryPrice;

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

    const advice = await generatePositionAdvice({
      position: {
        symbol: trade.symbol,
        side: trade.side,
        entryPrice: trade.entryPrice,
        quantity: trade.quantity,
        currentPrice,
        unrealizedPnl,
        unrealizedPnlPct,
        targetPrice: trade.targetPrice || undefined,
        stopLossPrice: trade.stopLossPrice || undefined,
        entryTime: trade.entryTime.toISOString(),
      },
      userTradeHistory: tradeHistory,
      userCapital: user?.capitalAmount || 100000,
      userRiskLimit: user?.dailyLossLimit || 2000,
    });

    const saved = await prisma.aiPositionAdvice.create({
      data: {
        userId,
        tradeId: trade.id,
        action: advice.action,
        currentPrice,
        reasoning: advice.reasoning,
        confidence: advice.confidence,
      },
    });

    results.push({
      ...advice,
      tradeId: trade.id,
      id: saved.id,
    });
  }

  return NextResponse.json({ advice: results });
}
