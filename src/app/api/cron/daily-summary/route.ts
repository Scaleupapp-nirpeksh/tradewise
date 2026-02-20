import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { sendSMS, formatDailySummary } from "@/lib/sms";
import { getISTMidnight } from "@/lib/market-hours";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { dailySummaryEnabled: true, onboardingComplete: true },
    select: { id: true, phone: true },
  });

  const todayIST = getISTMidnight();
  const todayDate = new Date(todayIST);

  let processed = 0;

  for (const user of users) {
    try {
      const todayTrades = await prisma.trade.findMany({
        where: {
          userId: user.id,
          status: "CLOSED",
          createdAt: { gte: todayIST },
        },
        select: { netPnl: true, grossPnl: true, charges: true },
      });

      // Skip if no trades today
      if (todayTrades.length === 0) continue;

      const winners = todayTrades.filter((t) => (t.netPnl || 0) > 0).length;
      const losers = todayTrades.filter((t) => (t.netPnl || 0) < 0).length;
      const grossPnl = todayTrades.reduce(
        (sum, t) => sum + (t.grossPnl || 0),
        0
      );
      const netPnl = todayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
      const totalCharges = grossPnl - netPnl;

      // Create/update DailySnapshot
      await prisma.dailySnapshot.upsert({
        where: {
          userId_date: { userId: user.id, date: todayDate },
        },
        update: {
          totalTrades: todayTrades.length,
          winners,
          losers,
          grossPnl,
          netPnl,
          totalCharges,
        },
        create: {
          userId: user.id,
          date: todayDate,
          totalTrades: todayTrades.length,
          winners,
          losers,
          grossPnl,
          netPnl,
          totalCharges,
        },
      });

      // Send SMS summary
      const winRate =
        todayTrades.length > 0
          ? Math.round((winners / todayTrades.length) * 100)
          : 0;

      const msg = formatDailySummary({
        totalTrades: todayTrades.length,
        winners,
        losers,
        winRate,
        netPnl,
      });

      const delivered = await sendSMS(user.phone, msg);

      await prisma.alertLog.create({
        data: {
          userId: user.id,
          type: "DAILY_SUMMARY",
          message: msg,
          delivered,
        },
      });

      processed++;
    } catch (error) {
      console.error(`Daily summary error for user ${user.id}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    usersProcessed: processed,
    totalUsers: users.length,
  });
}
