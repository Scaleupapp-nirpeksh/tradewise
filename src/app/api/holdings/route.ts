import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCachedPrices } from "@/lib/price-cache";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const holdings = await prisma.stockHolding.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (holdings.length === 0) {
      return NextResponse.json({
        holdings: [],
        totalInvested: 0,
        totalCurrentValue: 0,
        totalPnl: 0,
      });
    }

    // Fetch live prices for all symbols
    const symbols = [...new Set(holdings.map((h) => h.symbol))];
    const priceMap = await getCachedPrices(symbols, userId);

    let totalInvested = 0;
    let totalCurrentValue = 0;

    const enriched = holdings.map((h) => {
      const priceData = priceMap.get(h.symbol);
      const currentPrice = priceData?.price || h.currentPrice || h.buyPrice;
      const investedValue = h.buyPrice * h.quantity;
      const currentValue = currentPrice * h.quantity;
      const unrealizedPnl = currentValue - investedValue;
      const unrealizedPnlPct =
        investedValue > 0
          ? Math.round((unrealizedPnl / investedValue) * 10000) / 100
          : 0;

      totalInvested += investedValue;
      totalCurrentValue += currentValue;

      return {
        id: h.id,
        symbol: h.symbol,
        exchange: h.exchange,
        quantity: h.quantity,
        buyPrice: h.buyPrice,
        buyDate: h.buyDate.toISOString(),
        currentPrice,
        unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
        unrealizedPnlPct,
        investedValue: Math.round(investedValue * 100) / 100,
        currentValue: Math.round(currentValue * 100) / 100,
        notes: h.notes,
      };
    });

    return NextResponse.json({
      holdings: enriched,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalPnl: Math.round((totalCurrentValue - totalInvested) * 100) / 100,
    });
  } catch (error) {
    console.error("Failed to fetch holdings:", error);
    return NextResponse.json(
      { error: "Failed to fetch holdings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const { symbol, exchange, quantity, buyPrice, buyDate, notes } = body;

    if (!symbol || !quantity || !buyPrice || !buyDate) {
      return NextResponse.json(
        { error: "Symbol, quantity, buy price, and buy date are required" },
        { status: 400 }
      );
    }

    const holding = await prisma.stockHolding.create({
      data: {
        userId,
        symbol: symbol.toUpperCase(),
        exchange: exchange || "NSE",
        quantity: parseInt(quantity),
        buyPrice: parseFloat(buyPrice),
        buyDate: new Date(buyDate),
        notes: notes || null,
      },
    });

    return NextResponse.json(holding, { status: 201 });
  } catch (error) {
    console.error("Failed to create holding:", error);
    return NextResponse.json(
      { error: "Failed to create holding" },
      { status: 500 }
    );
  }
}
