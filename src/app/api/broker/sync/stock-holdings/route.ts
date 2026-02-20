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
      {
        error:
          "Broker not connected. Configure API credentials in Settings.",
      },
      { status: 400 }
    );
  }

  try {
    const holdings = await adapter.fetchHoldings();
    let imported = 0;
    let updated = 0;

    for (const h of holdings) {
      // Upsert by userId + symbol (dedup)
      const existing = await prisma.stockHolding.findFirst({
        where: { userId, symbol: h.symbol },
      });

      if (existing) {
        await prisma.stockHolding.update({
          where: { id: existing.id },
          data: {
            quantity: h.quantity,
            buyPrice: h.averagePrice,
            currentPrice: h.currentPrice,
            exchange: h.exchange,
          },
        });
        updated++;
      } else {
        await prisma.stockHolding.create({
          data: {
            userId,
            symbol: h.symbol,
            exchange: h.exchange,
            quantity: h.quantity,
            buyPrice: h.averagePrice,
            currentPrice: h.currentPrice,
            buyDate: new Date(),
          },
        });
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total: holdings.length,
    });
  } catch (error) {
    console.error("Broker sync stock holdings error:", error);
    return NextResponse.json(
      { error: "Failed to sync stock holdings" },
      { status: 500 }
    );
  }
}
