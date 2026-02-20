import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCachedPrice } from "@/lib/price-cache";
import { generatePositionAdvice } from "@/lib/ai-engine";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { tradeId } = await request.json();

  if (!tradeId) {
    return NextResponse.json({ error: "tradeId is required" }, { status: 400 });
  }

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId, status: "OPEN" },
  });

  if (!trade) {
    return NextResponse.json({ error: "Open trade not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { capitalAmount: true, dailyLossLimit: true },
  });

  const priceData = await getCachedPrice(trade.symbol);
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

  // Get user's past trades for this symbol
  const pastTrades = await prisma.trade.findMany({
    where: { userId, symbol: trade.symbol, status: "CLOSED" },
    orderBy: { createdAt: "desc" },
    take: 10,
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

  // Save to database
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

  return NextResponse.json({
    ...advice,
    tradeId: trade.id,
    id: saved.id,
  });
}
