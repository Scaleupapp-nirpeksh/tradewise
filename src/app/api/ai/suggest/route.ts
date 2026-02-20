import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTradeSuggestions } from "@/lib/ai-engine";
import { POPULAR_NSE_STOCKS } from "@/lib/market-data";
import { getCachedPrices } from "@/lib/price-cache";

const COOLDOWN_MINUTES = 5;
const DEDUP_HOURS = 6;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Cooldown: check if user generated suggestions recently
  const cooldownCutoff = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000);
  const recentSuggestion = await prisma.aiSuggestion.findFirst({
    where: { userId, createdAt: { gte: cooldownCutoff } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recentSuggestion) {
    const retryAfter = Math.ceil(
      (recentSuggestion.createdAt.getTime() + COOLDOWN_MINUTES * 60 * 1000 - Date.now()) / 1000
    );
    return NextResponse.json(
      { error: "cooldown", retryAfter, message: "Please wait before generating new suggestions." },
      { status: 429 }
    );
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { capitalAmount: true, dailyLossLimit: true, suggestionPreferences: true },
  });

  // Find symbols to exclude (recent PENDING suggestions + open positions)
  const dedupCutoff = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000);
  const [recentPending, openPositions] = await Promise.all([
    prisma.aiSuggestion.findMany({
      where: { userId, status: "PENDING", createdAt: { gte: dedupCutoff } },
      select: { symbol: true },
      distinct: ["symbol"],
    }),
    prisma.trade.findMany({
      where: { userId, status: "OPEN" },
      select: { symbol: true },
      distinct: ["symbol"],
    }),
  ]);

  const excludeSymbols = [
    ...new Set([
      ...recentPending.map((s) => s.symbol),
      ...openPositions.map((s) => s.symbol),
    ]),
  ];

  // Fetch market data for ALL popular stocks via Yahoo Finance (cached)
  const allSymbols = POPULAR_NSE_STOCKS.map((s) => s.symbol);
  const priceMap = await getCachedPrices(allSymbols, userId);

  const marketData: { symbol: string; price: number; change: number; changePercent: number }[] = [];
  for (const [symbol, entry] of priceMap) {
    marketData.push({
      symbol,
      price: entry.price,
      change: entry.change,
      changePercent: entry.changePct,
    });
  }

  if (marketData.length === 0) {
    return NextResponse.json(
      { error: "Unable to fetch market data. Please try again later." },
      { status: 503 }
    );
  }

  // Get user's recent trades
  const recentTrades = await prisma.trade.findMany({
    where: { userId, status: "CLOSED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { strategy: true },
  });

  const tradeHistory = recentTrades.map((t) => ({
    symbol: t.symbol,
    side: t.side,
    netPnl: t.netPnl || 0,
    strategy: t.strategy?.name,
  }));

  // Generate suggestions with exclusion list
  const suggestions = await generateTradeSuggestions({
    marketData,
    userTradeHistory: tradeHistory,
    userCapital: user?.capitalAmount,
    userRiskLimit: user?.dailyLossLimit,
    excludeSymbols: excludeSymbols.length > 0 ? excludeSymbols : undefined,
    preferences: user?.suggestionPreferences as { experience?: string; riskAppetite?: string; sectors?: string[]; tradeStyle?: string } | null,
  });

  // Save suggestions to database
  const saved = [];
  for (const s of suggestions) {
    const suggestion = await prisma.aiSuggestion.create({
      data: {
        userId,
        symbol: s.symbol,
        action: s.action,
        suggestedEntry: s.suggestedEntry,
        suggestedTarget: s.suggestedTarget,
        suggestedStopLoss: s.suggestedStopLoss,
        reasoning: s.reasoning,
        confidence: s.confidence,
      },
    });
    saved.push(suggestion);
  }

  return NextResponse.json({ suggestions: saved });
}
