import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBrokerAdapter } from "@/lib/broker";
import { calculateNetPnl } from "@/lib/charges";
import { BrokerChargeProfile } from "@/types";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const adapter = await getBrokerAdapter(userId);

  if (!adapter) {
    return NextResponse.json(
      { error: "Broker not connected" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const fromDate = body.fromDate
    ? new Date(body.fromDate)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days
  const toDate = body.toDate ? new Date(body.toDate) : new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { brokerChargeProfile: true },
  });

  const chargeProfile = user?.brokerChargeProfile as BrokerChargeProfile | null;

  try {
    const brokerTrades = await adapter.fetchTrades(fromDate, toDate);

    // Group trades by orderId to match buy/sell pairs
    let imported = 0;
    let skipped = 0;

    for (const trade of brokerTrades) {
      const existing = await prisma.trade.findFirst({
        where: { userId, brokerOrderId: trade.orderId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.trade.create({
        data: {
          userId,
          symbol: trade.symbol,
          exchange: trade.exchange,
          side: trade.side,
          quantity: trade.quantity,
          entryPrice: trade.price,
          entryTime: trade.timestamp,
          brokerOrderId: trade.orderId,
          status: "CLOSED",
          ...(() => {
            // If we have charge profile, calculate P&L
            if (chargeProfile) {
              const result = calculateNetPnl(
                trade.side,
                trade.price,
                trade.price, // Single-side record
                trade.quantity,
                trade.exchange,
                chargeProfile
              );
              return {
                grossPnl: result.grossPnl,
                netPnl: result.netPnl,
                charges: JSON.parse(JSON.stringify(result.charges)),
              };
            }
            return {};
          })(),
        },
      });

      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: brokerTrades.length,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Broker sync trades error:", error);
    return NextResponse.json(
      { error: "Failed to sync trades" },
      { status: 500 }
    );
  }
}
