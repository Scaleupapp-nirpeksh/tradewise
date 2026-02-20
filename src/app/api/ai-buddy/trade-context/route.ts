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

  const today = getISTMidnight();

  const [user, todayTrades, openCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { capitalAmount: true, dailyLossLimit: true },
    }),
    prisma.trade.findMany({
      where: {
        userId,
        status: "CLOSED",
        exitTime: { gte: today },
      },
      select: { netPnl: true },
    }),
    prisma.trade.count({
      where: { userId, status: "OPEN" },
    }),
  ]);

  const todayPnl = todayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);

  return NextResponse.json({
    capitalAmount: user?.capitalAmount || 0,
    dailyLossLimit: user?.dailyLossLimit || 0,
    todayPnl: Math.round(todayPnl * 100) / 100,
    todayTradeCount: todayTrades.length,
    openPositionCount: openCount,
  });
}
