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
    const holding = await prisma.stockHolding.findFirst({
      where: { id, userId },
    });

    if (!holding) {
      return NextResponse.json(
        { error: "Holding not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { quantity, buyPrice, notes, sellQuantity } = body;

    // Partial sell: reduce quantity
    if (sellQuantity && sellQuantity > 0) {
      const remaining = holding.quantity - parseInt(sellQuantity);
      if (remaining <= 0) {
        await prisma.stockHolding.delete({ where: { id } });
        return NextResponse.json({ deleted: true });
      }
      const updated = await prisma.stockHolding.update({
        where: { id },
        data: { quantity: remaining },
      });
      return NextResponse.json(updated);
    }

    // Regular update
    const updateData: Record<string, unknown> = {};
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (buyPrice !== undefined) updateData.buyPrice = parseFloat(buyPrice);
    if (notes !== undefined) updateData.notes = notes || null;

    const updated = await prisma.stockHolding.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update holding:", error);
    return NextResponse.json(
      { error: "Failed to update holding" },
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
    const holding = await prisma.stockHolding.findFirst({
      where: { id, userId },
    });

    if (!holding) {
      return NextResponse.json(
        { error: "Holding not found" },
        { status: 404 }
      );
    }

    await prisma.stockHolding.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete holding:", error);
    return NextResponse.json(
      { error: "Failed to delete holding" },
      { status: 500 }
    );
  }
}
