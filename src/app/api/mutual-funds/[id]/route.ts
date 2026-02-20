import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    const fund = await prisma.mutualFund.findFirst({
      where: { id, userId },
    });

    if (!fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    const body = await req.json();
    const { redeemUnits, units, investedAmount, isSip, sipAmount, sipDate, notes } = body;

    // Partial redemption
    if (redeemUnits && redeemUnits > 0) {
      const remaining = fund.units - parseFloat(redeemUnits);
      if (remaining <= 0.001) {
        // Redeem all — delete
        await prisma.mutualFund.delete({ where: { id } });
        return NextResponse.json({ deleted: true });
      }
      // Proportionally reduce invested amount
      const ratio = remaining / fund.units;
      const updated = await prisma.mutualFund.update({
        where: { id },
        data: {
          units: remaining,
          investedAmount: Math.round(fund.investedAmount * ratio * 100) / 100,
        },
      });
      return NextResponse.json(updated);
    }

    // Regular update
    const updateData: Record<string, unknown> = {};
    if (units !== undefined) updateData.units = parseFloat(units);
    if (investedAmount !== undefined)
      updateData.investedAmount = parseFloat(investedAmount);
    if (isSip !== undefined) updateData.isSip = isSip;
    if (sipAmount !== undefined)
      updateData.sipAmount = sipAmount ? parseFloat(sipAmount) : null;
    if (sipDate !== undefined)
      updateData.sipDate = sipDate ? parseInt(sipDate) : null;
    if (notes !== undefined) updateData.notes = notes || null;

    const updated = await prisma.mutualFund.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update mutual fund:", error);
    return NextResponse.json(
      { error: "Failed to update mutual fund" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    const fund = await prisma.mutualFund.findFirst({
      where: { id, userId },
    });

    if (!fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    await prisma.mutualFund.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete mutual fund:", error);
    return NextResponse.json(
      { error: "Failed to delete mutual fund" },
      { status: 500 }
    );
  }
}
