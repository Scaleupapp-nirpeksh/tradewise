import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBrokerAdapter } from "@/lib/broker";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const adapter = await getBrokerAdapter(userId);

  if (!adapter) {
    return NextResponse.json(
      { error: "Broker not connected. Configure API credentials in Settings." },
      { status: 400 }
    );
  }

  try {
    const positions = await adapter.fetchPositions();
    let imported = 0;
    let skipped = 0;

    for (const pos of positions) {
      // Skip if already imported (check by brokerOrderId)
      const existing = await prisma.trade.findFirst({
        where: { userId, brokerOrderId: pos.orderId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.trade.create({
        data: {
          userId,
          symbol: pos.symbol,
          exchange: pos.exchange,
          side: pos.side,
          quantity: pos.quantity,
          entryPrice: pos.entryPrice,
          entryTime: new Date(),
          brokerOrderId: pos.orderId,
          status: "OPEN",
        },
      });

      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: positions.length,
    });
  } catch (error) {
    console.error("Broker sync holdings error:", error);
    return NextResponse.json(
      { error: "Failed to sync holdings" },
      { status: 500 }
    );
  }
}
