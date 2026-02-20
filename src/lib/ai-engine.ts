import Anthropic from "@anthropic-ai/sdk";
import { AiSuggestionData, PositionAdviceData } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateTradeSuggestions(context: {
  marketData: { symbol: string; price: number; change: number; changePercent: number }[];
  userTradeHistory?: { symbol: string; side: string; netPnl: number; strategy?: string }[];
  userCapital?: number;
  userRiskLimit?: number;
  excludeSymbols?: string[];
  preferences?: {
    experience?: string;
    riskAppetite?: string;
    sectors?: string[];
    tradeStyle?: string;
  } | null;
}): Promise<AiSuggestionData[]> {
  const excludeNote = context.excludeSymbols?.length
    ? `\nIMPORTANT: Do NOT suggest these symbols (user already has recent suggestions or open positions for them): ${context.excludeSymbols.join(", ")}\n`
    : "";

  const prefsNote = context.preferences
    ? `\nUser Preferences:
- Experience Level: ${context.preferences.experience || "unknown"}
- Risk Appetite: ${context.preferences.riskAppetite || "moderate"}
- Preferred Sectors: ${context.preferences.sectors?.length ? context.preferences.sectors.join(", ") : "any"}
- Trade Style: ${context.preferences.tradeStyle || "not specified"}
Tailor suggestions to match these preferences.\n`
    : "";

  const prompt = `You are an Indian stock market trading assistant. Analyze the following market data and provide 3 intraday trade suggestions for NSE stocks.

IMPORTANT: Explain everything in simple, beginner-friendly language. No complex jargon. The user is a beginner trader.
${excludeNote}${prefsNote}
Current Market Data:
${context.marketData.map((s) => `${s.symbol}: ₹${s.price} (${s.changePercent > 0 ? "+" : ""}${s.changePercent}%)`).join("\n")}

${
  context.userTradeHistory?.length
    ? `User's Recent Trade History:
${context.userTradeHistory
  .slice(0, 10)
  .map((t) => `${t.symbol} ${t.side} → P&L: ₹${t.netPnl}`)
  .join("\n")}`
    : "User is a new trader with no history."
}

User Capital: ₹${context.userCapital || 100000}
Daily Risk Limit: ₹${context.userRiskLimit || 2000}

Provide suggestions in this exact JSON format:
[
  {
    "symbol": "STOCKNAME",
    "action": "BUY" or "SELL",
    "suggestedEntry": 123.45,
    "suggestedTarget": 128.00,
    "suggestedStopLoss": 121.00,
    "reasoning": "Simple explanation of why this trade makes sense",
    "confidence": "HIGH" or "MEDIUM" or "LOW"
  }
]

Rules:
1. Keep risk-reward ratio at least 1:2
2. Stop loss should not exceed the user's daily risk limit
3. Only suggest highly liquid NSE stocks from the market data provided
4. Explain reasoning in 1-2 simple sentences a beginner would understand
5. Pick DIFFERENT stocks each time — variety helps the user learn
6. Return ONLY the JSON array, no other text`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const suggestions: AiSuggestionData[] = JSON.parse(jsonMatch[0]);
    return suggestions;
  } catch (error) {
    console.error("AI suggestion error:", error);
    return [];
  }
}

export async function analyzeTradePerformance(trades: {
  symbol: string;
  side: string;
  grossPnl: number;
  netPnl: number;
  emotionTag?: string;
  strategy?: string;
}[]): Promise<string> {
  if (trades.length === 0) return "No trades to analyze yet. Start trading and I'll help you improve!";

  const prompt = `You are a friendly trading coach for a beginner Indian stock trader. Analyze their recent trades and give simple, actionable feedback.

Recent Trades:
${trades
  .map(
    (t) =>
      `${t.symbol} ${t.side} → Gross P&L: ₹${t.grossPnl}, Net P&L: ₹${t.netPnl}${t.emotionTag ? `, Emotion: ${t.emotionTag}` : ""}${t.strategy ? `, Strategy: ${t.strategy}` : ""}`
  )
  .join("\n")}

Total Trades: ${trades.length}
Winners: ${trades.filter((t) => t.netPnl > 0).length}
Losers: ${trades.filter((t) => t.netPnl < 0).length}

Give feedback in 3-4 short bullet points. Be encouraging but honest. Use simple language. Focus on:
1. What they're doing well
2. What they can improve
3. One specific tip for tomorrow`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content[0].type === "text"
      ? response.content[0].text
      : "Unable to analyze trades right now.";
  } catch (error) {
    console.error("AI analysis error:", error);
    return "Unable to analyze trades right now. Please try again later.";
  }
}

export async function generatePositionAdvice(context: {
  position: {
    symbol: string;
    side: string;
    entryPrice: number;
    quantity: number;
    currentPrice: number;
    unrealizedPnl: number;
    unrealizedPnlPct: number;
    targetPrice?: number;
    stopLossPrice?: number;
    entryTime: string;
  };
  userTradeHistory: {
    symbol: string;
    side: string;
    netPnl: number;
    emotionTag?: string;
    holdDuration?: number;
  }[];
  userCapital: number;
  userRiskLimit: number;
}): Promise<PositionAdviceData> {
  const pos = context.position;
  const historyForSymbol = context.userTradeHistory.filter(
    (t) => t.symbol === pos.symbol
  );

  const prompt = `You are a friendly trading assistant helping a beginner Indian trader decide what to do with their OPEN position.

Current Position:
- Stock: ${pos.symbol} (${pos.side})
- Entry Price: Rs${pos.entryPrice}
- Current Price: Rs${pos.currentPrice}
- Unrealized P&L: Rs${pos.unrealizedPnl} (${pos.unrealizedPnlPct}%)
${pos.targetPrice ? `- Target: Rs${pos.targetPrice}` : "- No target set"}
${pos.stopLossPrice ? `- Stop Loss: Rs${pos.stopLossPrice}` : "- No stop loss set"}
- Holding since: ${pos.entryTime}

${
  historyForSymbol.length > 0
    ? `Past Trades on ${pos.symbol}:
${historyForSymbol.slice(0, 5).map((t) => `  ${t.side} → P&L: Rs${t.netPnl}${t.emotionTag ? ` (${t.emotionTag})` : ""}`).join("\n")}`
    : `No past trades on ${pos.symbol}`
}

User Capital: Rs${context.userCapital}
Daily Risk Limit: Rs${context.userRiskLimit}

Respond with ONE of: HOLD, SELL, or BUY_MORE.
Explain in 2-3 simple sentences that a beginner would understand.

Return ONLY this JSON:
{
  "action": "HOLD" or "SELL" or "BUY_MORE",
  "reasoning": "Your explanation here",
  "confidence": "HIGH" or "MEDIUM" or "LOW"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        tradeId: "",
        action: "HOLD",
        currentPrice: pos.currentPrice,
        reasoning: "Unable to generate advice right now.",
        confidence: "LOW",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      tradeId: "",
      action: parsed.action,
      currentPrice: pos.currentPrice,
      reasoning: parsed.reasoning,
      confidence: parsed.confidence,
    };
  } catch (error) {
    console.error("AI position advice error:", error);
    return {
      tradeId: "",
      action: "HOLD",
      currentPrice: pos.currentPrice,
      reasoning: "Unable to generate advice right now. Please try again.",
      confidence: "LOW",
    };
  }
}

export async function generateImprovementSuggestions(context: {
  trades: { symbol: string; side: string; netPnl: number; emotionTag?: string; strategy?: string }[];
  goalsProgress: { type: string; target: number; current: number; achieved: boolean }[];
  weekStats: { totalTrades: number; winners: number; losers: number; netPnl: number };
}): Promise<string> {
  if (context.trades.length < 3) {
    return "Keep trading! I need at least 3 completed trades to give personalized improvement tips.";
  }

  const emotionBreakdown: Record<string, { count: number; avgPnl: number }> = {};
  for (const t of context.trades) {
    const tag = t.emotionTag || "NONE";
    if (!emotionBreakdown[tag]) emotionBreakdown[tag] = { count: 0, avgPnl: 0 };
    emotionBreakdown[tag].count++;
    emotionBreakdown[tag].avgPnl += t.netPnl;
  }
  for (const tag of Object.keys(emotionBreakdown)) {
    emotionBreakdown[tag].avgPnl /= emotionBreakdown[tag].count;
  }

  const prompt = `You are a friendly trading coach for a beginner Indian stock trader. Give them personalized improvement tips based on their data.

This Week's Stats:
- Total Trades: ${context.weekStats.totalTrades}
- Winners: ${context.weekStats.winners}, Losers: ${context.weekStats.losers}
- Net P&L: Rs${context.weekStats.netPnl}

Emotion Analysis:
${Object.entries(emotionBreakdown).map(([tag, data]) => `- ${tag}: ${data.count} trades, avg P&L Rs${data.avgPnl.toFixed(0)}`).join("\n")}

${
  context.goalsProgress.length > 0
    ? `Goals Progress:
${context.goalsProgress.map((g) => `- ${g.type}: Target ${g.target}, Current ${g.current} ${g.achieved ? "(Achieved!)" : ""}`).join("\n")}`
    : "No goals set yet."
}

Give 3-4 specific, actionable improvement tips. Be encouraging. Use simple language. If they have bad patterns (like losing money on FOMO/REVENGE trades), point it out kindly with a practical solution.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content[0].type === "text"
      ? response.content[0].text
      : "Unable to generate tips right now.";
  } catch (error) {
    console.error("AI improvement error:", error);
    return "Unable to generate improvement tips right now.";
  }
}
