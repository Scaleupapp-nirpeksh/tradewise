import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Get last 7 daily snapshots
  const snapshots = await prisma.dailySnapshot.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 7,
    select: { date: true, netPnl: true, totalTrades: true },
  });

  const recentDaysPnl = snapshots.map((s) => s.netPnl);

  // Yesterday's stats
  const yesterdayPnl = snapshots[0]?.netPnl || 0;
  const yesterdayTradeCount = snapshots[0]?.totalTrades || 0;

  // Days inactive
  let daysInactive = 0;
  if (snapshots.length > 0) {
    const lastTradeDate = snapshots[0].date;
    daysInactive = Math.floor(
      (Date.now() - new Date(lastTradeDate).getTime()) / 86400000
    );
  }

  return NextResponse.json({
    stats: {
      recentDaysPnl,
      yesterdayTradeCount,
      yesterdayPnl,
      dayOfWeek: new Date().getDay(),
      daysInactive,
    },
  });
}
