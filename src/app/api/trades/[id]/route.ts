import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNetPnl } from "@/lib/charges";
import { BrokerChargeProfile } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const trade = await prisma.trade.findFirst({
    where: { id, userId },
    include: { strategy: true },
  });

  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  return NextResponse.json(trade);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const body = await request.json();

  const existing = await prisma.trade.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  // Recalculate P&L if exit price is being updated
  let grossPnl = existing.grossPnl;
  let netPnl = existing.netPnl;
  let charges: unknown = existing.charges;
  let status = existing.status;

  const exitPrice = body.exitPrice ?? existing.exitPrice;
  const entryPrice = body.entryPrice ?? existing.entryPrice;
  const quantity = body.quantity ?? existing.quantity;
  const side = body.side ?? existing.side;
  const exchange = body.exchange ?? existing.exchange;

  if (exitPrice && exitPrice > 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { brokerChargeProfile: true },
    });

    const chargeProfile = user?.brokerChargeProfile as BrokerChargeProfile | null;

    const result = calculateNetPnl(
      side,
      entryPrice,
      exitPrice,
      quantity,
      exchange,
      chargeProfile || undefined
    );
    grossPnl = result.grossPnl;
    netPnl = result.netPnl;
    charges = result.charges;
    status = "CLOSED";
  }

  // Build update data explicitly to avoid spreading unknown fields
  const updateData: Record<string, unknown> = {};
  if (body.symbol !== undefined) updateData.symbol = body.symbol;
  if (body.exchange !== undefined) updateData.exchange = body.exchange;
  if (body.side !== undefined) updateData.side = body.side;
  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.entryPrice !== undefined) updateData.entryPrice = body.entryPrice;
  if (body.targetPrice !== undefined) updateData.targetPrice = body.targetPrice;
  if (body.stopLossPrice !== undefined) updateData.stopLossPrice = body.stopLossPrice;
  if (body.strategyId !== undefined) updateData.strategyId = body.strategyId;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.emotionTag !== undefined) updateData.emotionTag = body.emotionTag;
  if (body.setupRating !== undefined) updateData.setupRating = body.setupRating;
  if (body.entryTime !== undefined) updateData.entryTime = new Date(body.entryTime);

  const trade = await prisma.trade.update({
    where: { id },
    data: {
      ...updateData,
      exitPrice,
      grossPnl,
      netPnl,
      charges: charges ? JSON.parse(JSON.stringify(charges)) : undefined,
      status,
      exitTime: exitPrice ? (body.exitTime ? new Date(body.exitTime) : new Date()) : null,
    },
    include: { strategy: true },
  });

  return NextResponse.json(trade);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const trade = await prisma.trade.findFirst({
    where: { id, userId },
  });

  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  await prisma.trade.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
