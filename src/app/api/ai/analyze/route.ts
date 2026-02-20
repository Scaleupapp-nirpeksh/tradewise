import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeTradePerformance } from "@/lib/ai-engine";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const recentTrades = await prisma.trade.findMany({
    where: { userId, status: "CLOSED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { strategy: true },
  });

  const tradesForAnalysis = recentTrades.map((t) => ({
    symbol: t.symbol,
    side: t.side,
    grossPnl: t.grossPnl || 0,
    netPnl: t.netPnl || 0,
    emotionTag: t.emotionTag || undefined,
    strategy: t.strategy?.name,
  }));

  const analysis = await analyzeTradePerformance(tradesForAnalysis);

  return NextResponse.json({ analysis });
}
