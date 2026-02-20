import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const tradeId = req.nextUrl.searchParams.get("tradeId");
  if (!tradeId) {
    return NextResponse.json({ error: "tradeId required" }, { status: 400 });
  }

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId },
    select: {
      id: true,
      netPnl: true,
      grossPnl: true,
      emotionTag: true,
      stopLossPrice: true,
      status: true,
    },
  });

  if (!trade || trade.status !== "CLOSED") {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  // Get user's closed trades for comparison
  const allClosed = await prisma.trade.findMany({
    where: { userId, status: "CLOSED" },
    select: { netPnl: true, emotionTag: true, stopLossPrice: true },
  });

  const tips: { id: string; message: string; severity: string }[] = [];
  const netPnl = trade.netPnl || 0;

  // Compute averages
  const profits = allClosed.filter((t) => (t.netPnl || 0) > 0);
  const losses = allClosed.filter((t) => (t.netPnl || 0) < 0);
  const avgWin = profits.length > 0
    ? profits.reduce((s, t) => s + (t.netPnl || 0), 0) / profits.length
    : 0;
  const avgLoss = losses.length > 0
    ? Math.abs(losses.reduce((s, t) => s + (t.netPnl || 0), 0) / losses.length)
    : 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Math.abs(n));

  // Emotion tag analysis
  if (
    trade.emotionTag &&
    (trade.emotionTag === "FOMO" || trade.emotionTag === "REVENGE") &&
    netPnl < 0
  ) {
    const planned = allClosed.filter((t) => t.emotionTag === "PLANNED");
    const plannedAvg =
      planned.length > 0
        ? Math.round(
            planned.reduce((s, t) => s + (t.netPnl || 0), 0) / planned.length
          )
        : 0;
    tips.push({
      id: "insight-emotion-loss",
      severity: "warning",
      message: `This ${trade.emotionTag} trade lost ${fmt(Math.abs(netPnl))}.${
        planned.length >= 3
          ? ` Your planned trades average ${plannedAvg >= 0 ? "+" : ""}${fmt(Math.abs(plannedAvg))}.`
          : ""
      }`,
    });
  }

  // Loss much bigger than average
  if (netPnl < 0 && avgLoss > 0 && Math.abs(netPnl) > avgLoss * 2) {
    const multiple = (Math.abs(netPnl) / avgLoss).toFixed(1);
    tips.push({
      id: "insight-big-loss",
      severity: "danger",
      message: `This loss was ${multiple}x your average loss (${fmt(avgLoss)}). A tighter stop-loss would have limited the damage.`,
    });
  }

  // Profit above average
  if (netPnl > 0 && avgWin > 0 && netPnl > avgWin * 1.5) {
    const multiple = (netPnl / avgWin).toFixed(1);
    tips.push({
      id: "insight-big-win",
      severity: "success",
      message: `This made ${multiple}x your average win (${fmt(avgWin)}). What went right? Note it down so you can repeat it.`,
    });
  }

  // No stop-loss and lost money
  if (!trade.stopLossPrice && netPnl < 0) {
    tips.push({
      id: "insight-no-sl-loss",
      severity: "warning",
      message: `No stop-loss was set and you lost ${fmt(Math.abs(netPnl))}. A stop-loss would have capped this.`,
    });
  }

  // Charges ate all profit
  if (
    trade.grossPnl &&
    trade.grossPnl > 0 &&
    netPnl < 0
  ) {
    tips.push({
      id: "insight-charges-ate-profit",
      severity: "info",
      message:
        "This was profitable before charges. Aim for bigger price moves or more quantity to beat the fixed costs.",
    });
  }

  return NextResponse.json({ tips });
}
