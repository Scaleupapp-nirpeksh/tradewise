import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { isMarketOpen } from "@/lib/market-hours";
import { prisma } from "@/lib/prisma";
import { checkPriceAlerts, checkDailyLossLimit } from "@/lib/alert-service";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMarketOpen()) {
    return NextResponse.json({ skipped: true, reason: "Market closed" });
  }

  // Get all users with open trades that have targets/stop-losses
  const usersWithPositions = await prisma.trade.findMany({
    where: {
      status: "OPEN",
      OR: [
        { targetPrice: { not: null } },
        { stopLossPrice: { not: null } },
      ],
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  const userIds = usersWithPositions.map((t) => t.userId);

  let alertsSent = 0;

  for (const userId of userIds) {
    try {
      await checkPriceAlerts(userId);
      await checkDailyLossLimit(userId);
      alertsSent++;
    } catch (error) {
      console.error(`Price check error for user ${userId}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    usersChecked: userIds.length,
    timestamp: new Date().toISOString(),
  });
}
