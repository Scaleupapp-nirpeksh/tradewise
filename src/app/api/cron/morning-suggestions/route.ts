import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { generateTradeSuggestions } from "@/lib/ai-engine";
import { getStockQuote, POPULAR_NSE_STOCKS } from "@/lib/market-data";
import { sendSMS, formatAiSuggestion } from "@/lib/sms";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all users with morning AI enabled
  const users = await prisma.user.findMany({
    where: { morningAiEnabled: true, onboardingComplete: true },
    select: {
      id: true,
      phone: true,
      capitalAmount: true,
      dailyLossLimit: true,
    },
  });

  // Fetch market data once for all users (shared)
  const topStocks = POPULAR_NSE_STOCKS.slice(0, 10);
  const marketData: { symbol: string; price: number; change: number; changePercent: number }[] = [];

  for (const stock of topStocks) {
    try {
      const quote = await getStockQuote(stock.symbol);
      if (quote) {
        marketData.push({
          symbol: stock.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
        });
      }
    } catch {
      // Skip failed quotes
    }
  }

  let processed = 0;

  for (const user of users) {
    try {
      // Get user's recent trade history
      const recentTrades = await prisma.trade.findMany({
        where: { userId: user.id, status: "CLOSED" },
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

      const suggestions = await generateTradeSuggestions({
        marketData,
        userTradeHistory: tradeHistory,
        userCapital: user.capitalAmount,
        userRiskLimit: user.dailyLossLimit,
      });

      // Save suggestions
      for (const s of suggestions) {
        await prisma.aiSuggestion.create({
          data: {
            userId: user.id,
            symbol: s.symbol,
            action: s.action,
            suggestedEntry: s.suggestedEntry,
            suggestedTarget: s.suggestedTarget,
            suggestedStopLoss: s.suggestedStopLoss,
            reasoning: s.reasoning,
            confidence: s.confidence,
          },
        });
      }

      // Send top suggestion via SMS
      if (suggestions.length > 0) {
        const top = suggestions[0];
        const msg = formatAiSuggestion({
          symbol: top.symbol,
          action: top.action,
          entry: top.suggestedEntry,
          target: top.suggestedTarget,
          stopLoss: top.suggestedStopLoss,
          reasoning: top.reasoning,
        });
        await sendSMS(user.phone, msg);

        await prisma.alertLog.create({
          data: {
            userId: user.id,
            type: "AI_SUGGESTION",
            message: msg,
            delivered: true,
          },
        });
      }

      processed++;
    } catch (error) {
      console.error(`Morning suggestion error for user ${user.id}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    usersProcessed: processed,
    totalUsers: users.length,
  });
}
