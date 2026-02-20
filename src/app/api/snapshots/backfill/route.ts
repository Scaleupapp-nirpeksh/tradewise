import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Get all closed trades to build daily snapshots
  const trades = await prisma.trade.findMany({
    where: { userId, status: "CLOSED" },
    orderBy: { entryTime: "asc" },
  });

  if (trades.length === 0) {
    return NextResponse.json({ message: "No trades to backfill", days: 0 });
  }

  // Group trades by date
  const dayMap = new Map<
    string,
    { trades: typeof trades; date: Date }
  >();

  for (const trade of trades) {
    const dateKey = trade.entryTime.toISOString().split("T")[0];
    if (!dayMap.has(dateKey)) {
      const d = new Date(dateKey);
      dayMap.set(dateKey, { trades: [], date: d });
    }
    dayMap.get(dateKey)!.trades.push(trade);
  }

  let created = 0;

  for (const [, { trades: dayTrades, date }] of dayMap) {
    const totalTrades = dayTrades.length;
    const winners = dayTrades.filter((t) => (t.netPnl || 0) > 0).length;
    const netPnl = dayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    const grossPnl = dayTrades.reduce((sum, t) => sum + (t.grossPnl || 0), 0);
    const charges = grossPnl - netPnl;

    await prisma.dailySnapshot.upsert({
      where: {
        userId_date: { userId, date },
      },
      update: {
        totalTrades,
        winners: winners,
        losers: totalTrades - winners,
        grossPnl,
        netPnl,
        totalCharges: charges,
      },
      create: {
        userId,
        date,
        totalTrades,
        winners: winners,
        losers: totalTrades - winners,
        grossPnl,
        netPnl,
        totalCharges: charges,
      },
    });

    created++;
  }

  return NextResponse.json({
    message: `Backfilled ${created} daily snapshots`,
    days: created,
  });
}
