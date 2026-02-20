import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNetPnl } from "@/lib/charges";
import { BrokerChargeProfile } from "@/types";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  const trades = await prisma.trade.findMany({
    where,
    include: { strategy: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.trade.count({ where });

  return NextResponse.json({ trades, total });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();

  // Get user's charge profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { brokerChargeProfile: true },
  });

  const chargeProfile = user?.brokerChargeProfile as BrokerChargeProfile | null;

  // Calculate P&L if trade is closed (has exit price)
  let grossPnl = null;
  let netPnl = null;
  let charges = null;
  let status: "OPEN" | "CLOSED" = "OPEN";

  if (body.exitPrice && body.exitPrice > 0) {
    const result = calculateNetPnl(
      body.side,
      body.entryPrice,
      body.exitPrice,
      body.quantity,
      body.exchange || "NSE",
      chargeProfile || undefined
    );
    grossPnl = result.grossPnl;
    netPnl = result.netPnl;
    charges = result.charges;
    status = "CLOSED";
  }

  const trade = await prisma.trade.create({
    data: {
      userId,
      symbol: body.symbol.toUpperCase(),
      exchange: body.exchange || "NSE",
      side: body.side,
      quantity: body.quantity,
      entryPrice: body.entryPrice,
      exitPrice: body.exitPrice || null,
      entryTime: new Date(body.entryTime),
      exitTime: body.exitTime ? new Date(body.exitTime) : null,
      grossPnl,
      netPnl,
      charges: charges ? JSON.parse(JSON.stringify(charges)) : undefined,
      targetPrice: body.targetPrice || null,
      stopLossPrice: body.stopLossPrice || null,
      strategyId: body.strategyId || null,
      notes: body.notes || null,
      emotionTag: body.emotionTag || null,
      setupRating: body.setupRating || null,
      status,
    },
    include: { strategy: true },
  });

  return NextResponse.json(trade);
}
