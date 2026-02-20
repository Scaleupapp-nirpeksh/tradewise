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

  const goals = await prisma.tradingGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Calculate current progress for each goal
  const today = getISTMidnight();

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      const trades = await prisma.trade.findMany({
        where: {
          userId,
          status: "CLOSED",
          createdAt: {
            gte: goal.startDate,
            lte: goal.endDate,
          },
        },
        select: { netPnl: true },
      });

      let currentValue = 0;
      switch (goal.type) {
        case "NET_PNL":
          currentValue = trades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
          break;
        case "WIN_RATE":
          if (trades.length > 0) {
            const winners = trades.filter((t) => (t.netPnl || 0) > 0).length;
            currentValue = (winners / trades.length) * 100;
          }
          break;
        case "TOTAL_TRADES":
          currentValue = trades.length;
          break;
        case "MAX_LOSS_PER_TRADE":
          const losses = trades
            .filter((t) => (t.netPnl || 0) < 0)
            .map((t) => Math.abs(t.netPnl || 0));
          currentValue = losses.length > 0 ? Math.max(...losses) : 0;
          break;
      }

      // Update currentValue in DB
      await prisma.tradingGoal.update({
        where: { id: goal.id },
        data: {
          currentValue,
          achieved:
            goal.type === "MAX_LOSS_PER_TRADE"
              ? currentValue <= goal.targetValue
              : currentValue >= goal.targetValue,
        },
      });

      return {
        ...goal,
        currentValue,
        achieved:
          goal.type === "MAX_LOSS_PER_TRADE"
            ? currentValue <= goal.targetValue
            : currentValue >= goal.targetValue,
      };
    })
  );

  return NextResponse.json({ goals: goalsWithProgress });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();

  const goal = await prisma.tradingGoal.create({
    data: {
      userId,
      type: body.type,
      targetValue: body.targetValue,
      period: body.period,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    },
  });

  return NextResponse.json(goal);
}
