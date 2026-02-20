import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getISTMidnight } from "@/lib/market-hours";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const todayStart = getISTMidnight();

  const [openTrades, todayTrades, goals, user] = await Promise.all([
    prisma.trade.findMany({
      where: { userId, status: "OPEN" },
      select: { id: true, stopLossPrice: true },
    }),
    prisma.trade.findMany({
      where: { userId, entryTime: { gte: todayStart } },
      select: { netPnl: true },
    }),
    prisma.tradingGoal.findMany({
      where: { userId },
      select: { id: true },
      take: 1,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { dailyLossLimit: true },
    }),
  ]);

  const todayPnl = todayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const dailyLossLimit = user?.dailyLossLimit || 2000;
  const dailyLossExceeded = todayPnl < 0 && Math.abs(todayPnl) >= dailyLossLimit;

  const positionsWithoutSl = openTrades.filter(
    (t) => !t.stopLossPrice || t.stopLossPrice <= 0
  ).length;

  return NextResponse.json({
    hasOpenPositions: openTrades.length > 0,
    positionsWithoutSl,
    hasTradesToday: todayTrades.length > 0,
    hasGoals: goals.length > 0,
    dailyLossExceeded,
  });
}
