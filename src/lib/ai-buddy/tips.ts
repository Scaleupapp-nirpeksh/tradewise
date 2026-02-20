/**
 * AI Buddy — Pure rule-based tip functions.
 * All functions are client-safe (no DB, no API calls).
 */

export type TipSeverity = "info" | "warning" | "success" | "danger";

export interface BuddyTip {
  id: string;
  message: string;
  severity: TipSeverity;
}

// --------------- helpers ---------------

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Math.abs(n));
}

function calcCharges(entry: number, exit: number, qty: number) {
  const buy = entry * qty;
  const sell = exit * qty;
  const total = buy + sell;
  const brokerage = 40; // ₹20 x 2
  const stt = (sell * 0.025) / 100;
  const exch = (total * 0.00297) / 100;
  const gst = ((brokerage + exch) * 18) / 100;
  const sebi = (total * 10) / 10000000;
  const stamp = (buy * 0.003) / 100;
  return Math.round((brokerage + stt + exch + gst + sebi + stamp) * 100) / 100;
}

// --------------- Close Trade Tips ---------------

export function getCloseTradeTips(params: {
  side: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLossPrice?: number | null;
  entryTime?: string | null;
}): BuddyTip[] {
  const { side, entryPrice, exitPrice, quantity, stopLossPrice, entryTime } = params;
  if (!entryPrice || !exitPrice || !quantity) return [];

  const tips: BuddyTip[] = [];
  const gross =
    side === "BUY"
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity;
  const charges = calcCharges(entryPrice, exitPrice, quantity);
  const net = gross - charges;

  if (net < 0) {
    tips.push({
      id: "close-net-loss",
      severity: "warning",
      message: `This will be a net loss of ${fmt(net)} after charges. That's okay — managing losses is part of trading.`,
    });
  } else if (net > 0) {
    tips.push({
      id: "close-net-profit",
      severity: "success",
      message: `You're locking in ${fmt(net)} profit after all charges. Well done!`,
    });
  }

  if (gross > 0 && charges > gross * 0.5) {
    const pct = Math.round((charges / gross) * 100);
    tips.push({
      id: "close-charges-high",
      severity: "info",
      message: `Charges are ${fmt(charges)} on ${fmt(gross)} gross profit (${pct}%). Bigger price moves or higher quantity improve this ratio.`,
    });
  }

  if (!stopLossPrice) {
    tips.push({
      id: "close-no-sl",
      severity: "info",
      message: "This trade had no stop-loss. Next time, set one before entering to protect your capital.",
    });
  }

  if (entryTime) {
    const held = (Date.now() - new Date(entryTime).getTime()) / 60000;
    if (held < 2) {
      tips.push({
        id: "close-quick-exit",
        severity: "warning",
        message: "You held this for less than 2 minutes. Very quick exits often mean panic — was this planned?",
      });
    }
  }

  return tips;
}

// --------------- New Trade Form Tips ---------------

export interface TradeFormContext {
  capitalAmount: number;
  dailyLossLimit: number;
  todayPnl: number;
  todayTradeCount: number;
  openPositionCount: number;
}

export function getNewTradeTips(params: {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: string;
  entryPrice: string;
  targetPrice: string;
  stopLossPrice: string;
  emotionTag: string;
  context: TradeFormContext | null;
}): BuddyTip[] {
  const tips: BuddyTip[] = [];
  const qty = parseFloat(params.quantity) || 0;
  const entry = parseFloat(params.entryPrice) || 0;
  const target = parseFloat(params.targetPrice) || 0;
  const sl = parseFloat(params.stopLossPrice) || 0;
  const ctx = params.context;

  // No stop-loss
  if (entry > 0 && qty > 0 && !sl) {
    tips.push({
      id: "form-no-sl",
      severity: "danger",
      message: "No stop-loss set! Every trade needs a maximum loss limit to protect your capital.",
    });
  }

  // No target
  if (entry > 0 && qty > 0 && !target) {
    tips.push({
      id: "form-no-target",
      severity: "info",
      message: "No target set. Having one helps you take profits instead of watching them vanish.",
    });
  }

  // Bad R/R ratio
  if (entry > 0 && target > 0 && sl > 0) {
    const reward = Math.abs(target - entry);
    const risk = Math.abs(entry - sl);
    if (risk > 0) {
      const ratio = reward / risk;
      if (ratio < 1) {
        tips.push({
          id: "form-bad-rr",
          severity: "warning",
          message: `Risk/reward is 1:${ratio.toFixed(1)} — you're risking more than you can gain. Aim for at least 1:2.`,
        });
      }
    }
  }

  // Position too large
  if (ctx && entry > 0 && qty > 0) {
    const positionValue = entry * qty;
    const pct = (positionValue / ctx.capitalAmount) * 100;
    if (ctx.capitalAmount > 0 && pct > 10) {
      tips.push({
        id: "form-large-position",
        severity: "warning",
        message: `This trade uses ${Math.round(pct)}% of your capital (${fmt(positionValue)}). Keeping each trade under 10% helps you survive bad days.`,
      });
    }
  }

  // SL loss exceeds remaining daily budget
  if (ctx && entry > 0 && sl > 0 && qty > 0) {
    const maxLoss = Math.abs(entry - sl) * qty;
    const remaining = ctx.dailyLossLimit - Math.abs(ctx.todayPnl);
    if (ctx.dailyLossLimit > 0 && remaining > 0 && maxLoss > remaining) {
      tips.push({
        id: "form-exceeds-budget",
        severity: "danger",
        message: `If stop-loss hits, you lose ${fmt(maxLoss)} — that exceeds your remaining daily budget of ${fmt(remaining)}.`,
      });
    }
  }

  // Emotion tag
  if (params.emotionTag === "FOMO" || params.emotionTag === "REVENGE") {
    tips.push({
      id: "form-emotion",
      severity: "danger",
      message: `You marked this as ${params.emotionTag}. These trades usually lose money. Take a deep breath — is this really a good setup?`,
    });
  } else if (params.emotionTag === "IMPULSE") {
    tips.push({
      id: "form-impulse",
      severity: "warning",
      message: "Impulse trades can work, but your best trades come from planned setups. Double-check your reasoning.",
    });
  }

  // Overtrading
  if (ctx && ctx.todayTradeCount >= 5 && ctx.todayPnl < 0) {
    tips.push({
      id: "form-overtrading",
      severity: "warning",
      message: `You've taken ${ctx.todayTradeCount} trades today and you're down ${fmt(ctx.todayPnl)}. More trades when losing usually means more losses.`,
    });
  }

  return tips;
}

// --------------- Position Tips ---------------

export function getPositionTips(pos: {
  unrealizedPnlPct: number;
  stopLossPrice: number | null;
  targetPrice: number | null;
  distanceToTarget: number | null;
  distanceToStopLoss: number | null;
  entryTime: string;
}): BuddyTip[] {
  const tips: BuddyTip[] = [];

  if (!pos.stopLossPrice) {
    tips.push({
      id: "pos-no-sl",
      severity: "danger",
      message: "No stop-loss! You're exposed to unlimited downside.",
    });
  }

  if (pos.unrealizedPnlPct >= 100) {
    tips.push({
      id: "pos-doubled",
      severity: "success",
      message: "This trade has doubled! Seriously consider booking profits.",
    });
  } else if (pos.unrealizedPnlPct >= 50) {
    tips.push({
      id: "pos-up-big",
      severity: "success",
      message: `Up ${Math.round(pos.unrealizedPnlPct)}%! Consider booking profits — don't let a big winner turn into a loser.`,
    });
  }

  if (pos.unrealizedPnlPct <= -30) {
    tips.push({
      id: "pos-down-big",
      severity: "danger",
      message: `Down ${Math.round(Math.abs(pos.unrealizedPnlPct))}%. Is your original thesis still valid? Consider cutting losses.`,
    });
  }

  if (pos.distanceToTarget !== null && Math.abs(pos.distanceToTarget) <= 1) {
    tips.push({
      id: "pos-near-target",
      severity: "success",
      message: `Almost at your target (${Math.abs(pos.distanceToTarget).toFixed(1)}% away). Get ready to exit!`,
    });
  }

  if (pos.distanceToStopLoss !== null && Math.abs(pos.distanceToStopLoss) <= 1) {
    tips.push({
      id: "pos-near-sl",
      severity: "danger",
      message: `Approaching stop-loss (${Math.abs(pos.distanceToStopLoss).toFixed(1)}% away). Prepare to exit if it hits.`,
    });
  }

  return tips;
}

// --------------- Goal Tips ---------------

export function getGoalTips(goal: {
  type: string;
  targetValue: number;
  currentValue: number;
  period: string;
  startDate: string;
  endDate: string;
  achieved: boolean;
}): BuddyTip[] {
  const tips: BuddyTip[] = [];

  if (goal.achieved) {
    tips.push({
      id: `goal-achieved-${goal.type}`,
      severity: "success",
      message: "Goal achieved! Consider setting a new, slightly higher target.",
    });
    return tips;
  }

  const now = new Date();
  const end = new Date(goal.endDate);
  const start = new Date(goal.startDate);
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86400000);
  const elapsed = Math.max(0, (now.getTime() - start.getTime()) / 86400000);
  const remaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
  const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
  const expectedProgress = (elapsed / totalDays) * 100;

  if (progress >= 80 && remaining > (totalDays * 0.3)) {
    tips.push({
      id: `goal-ahead-${goal.type}`,
      severity: "success",
      message: `${Math.round(progress)}% done with ${remaining} days left. Great pace — keep it up!`,
    });
  } else if (progress < 30 && remaining < (totalDays * 0.3)) {
    const dailyNeeded = goal.targetValue > 0
      ? Math.round(((goal.targetValue - goal.currentValue) / Math.max(1, remaining)) * 100) / 100
      : 0;
    tips.push({
      id: `goal-behind-${goal.type}`,
      severity: "warning",
      message: `Only ${Math.round(progress)}% done with ${remaining} day${remaining !== 1 ? "s" : ""} left. You'd need ${fmt(dailyNeeded)}/day to hit the target.`,
    });
  } else if (progress < expectedProgress * 0.5 && elapsed > totalDays * 0.3) {
    tips.push({
      id: `goal-slow-${goal.type}`,
      severity: "info",
      message: `You're behind pace. Expected ${Math.round(expectedProgress)}% done by now, but at ${Math.round(progress)}%.`,
    });
  }

  if (goal.type === "MAX_LOSS_PER_TRADE" && goal.currentValue > goal.targetValue) {
    tips.push({
      id: `goal-exceeded-${goal.type}`,
      severity: "danger",
      message: "You've exceeded your max-loss-per-trade goal. Tighten your stop-losses.",
    });
  }

  return tips;
}

// --------------- Analytics Insights ---------------

interface AnalyticsTrade {
  netPnl: number | null;
  emotionTag: string | null;
  createdAt: string;
  strategy: { name: string } | null;
}

export function getAnalyticsInsights(trades: AnalyticsTrade[]): BuddyTip[] {
  const tips: BuddyTip[] = [];
  const closed = trades.filter((t) => t.netPnl !== null);
  if (closed.length < 5) return tips;

  // Win rate
  const wins = closed.filter((t) => (t.netPnl || 0) > 0);
  const losses = closed.filter((t) => (t.netPnl || 0) < 0);
  const winRate = Math.round((wins.length / closed.length) * 100);

  if (winRate >= 60) {
    tips.push({
      id: "analytics-good-wr",
      severity: "success",
      message: `Your win rate is ${winRate}% — that's solid! Focus on keeping your losses small.`,
    });
  }

  // Avg win vs avg loss
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.netPnl || 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.netPnl || 0), 0) / losses.length) : 0;
  if (avgLoss > 0 && avgWin > 0 && avgLoss > avgWin * 2) {
    const ratio = (avgLoss / avgWin).toFixed(1);
    tips.push({
      id: "analytics-loss-ratio",
      severity: "danger",
      message: `Your average loss (${fmt(avgLoss)}) is ${ratio}x your average win (${fmt(avgWin)}). Use tighter stop-losses or bigger targets.`,
    });
  }

  // Emotion analysis
  const byEmotion: Record<string, { sum: number; count: number }> = {};
  for (const t of closed) {
    const tag = t.emotionTag || "NONE";
    if (!byEmotion[tag]) byEmotion[tag] = { sum: 0, count: 0 };
    byEmotion[tag].sum += t.netPnl || 0;
    byEmotion[tag].count++;
  }
  const fomo = byEmotion["FOMO"];
  const planned = byEmotion["PLANNED"];
  if (fomo && fomo.count >= 3 && fomo.sum / fomo.count < 0) {
    const fomoAvg = Math.round(fomo.sum / fomo.count);
    const plannedAvg = planned ? Math.round(planned.sum / planned.count) : 0;
    tips.push({
      id: "analytics-fomo",
      severity: "warning",
      message: `FOMO trades lose ${fmt(Math.abs(fomoAvg))} on average${planned ? `, while planned trades make ${fmt(plannedAvg)}` : ""}. The pattern is clear.`,
    });
  }
  const revenge = byEmotion["REVENGE"];
  if (revenge && revenge.count >= 2 && revenge.sum / revenge.count < 0) {
    tips.push({
      id: "analytics-revenge",
      severity: "danger",
      message: `Revenge trades are costing you ${fmt(Math.abs(revenge.sum))} total. Wait 30 minutes after a loss before trading again.`,
    });
  }

  // Day of week analysis
  const byDay: Record<number, { wins: number; total: number }> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const t of closed) {
    const day = new Date(t.createdAt).getDay();
    if (!byDay[day]) byDay[day] = { wins: 0, total: 0 };
    byDay[day].total++;
    if ((t.netPnl || 0) > 0) byDay[day].wins++;
  }
  for (const [day, stats] of Object.entries(byDay)) {
    if (stats.total >= 5) {
      const dayWinRate = Math.round((stats.wins / stats.total) * 100);
      if (dayWinRate < 30) {
        tips.push({
          id: `analytics-day-${day}`,
          severity: "info",
          message: `Your win rate drops to ${dayWinRate}% on ${dayNames[parseInt(day)]}s. Consider trading less aggressively.`,
        });
      }
    }
  }

  // Untagged trades
  const untagged = closed.filter((t) => !t.emotionTag).length;
  if (untagged > closed.length * 0.5) {
    tips.push({
      id: "analytics-untagged",
      severity: "info",
      message: `${Math.round((untagged / closed.length) * 100)}% of your trades have no emotion tag. Tagging helps you find what works.`,
    });
  }

  return tips;
}

// --------------- Daily Tip ---------------

export function getDailyTip(stats: {
  recentDaysPnl: number[]; // last 7 days (newest first), negative = losing day
  yesterdayTradeCount: number;
  yesterdayPnl: number;
  dayOfWeek: number; // 0=Sun, 1=Mon, ...
  daysInactive: number;
}): BuddyTip | null {
  const { recentDaysPnl, yesterdayTradeCount, yesterdayPnl, dayOfWeek, daysInactive } = stats;

  // Losing streak (3+ consecutive losing days)
  let losingStreak = 0;
  for (const pnl of recentDaysPnl) {
    if (pnl < 0) losingStreak++;
    else break;
  }
  if (losingStreak >= 3) {
    return {
      id: "daily-losing-streak",
      severity: "warning",
      message: `You've had ${losingStreak} tough days in a row. Consider trading smaller today or taking a break.`,
    };
  }

  // Winning streak
  let winningStreak = 0;
  for (const pnl of recentDaysPnl) {
    if (pnl > 0) winningStreak++;
    else break;
  }
  if (winningStreak >= 3) {
    return {
      id: "daily-winning-streak",
      severity: "success",
      message: `You're on a ${winningStreak}-day winning streak! Stay disciplined — overconfidence can break a streak.`,
    };
  }

  // Overtrading yesterday
  if (yesterdayTradeCount >= 10 && yesterdayPnl < 0) {
    return {
      id: "daily-overtraded",
      severity: "warning",
      message: `You took ${yesterdayTradeCount} trades yesterday and lost ${fmt(Math.abs(yesterdayPnl))}. Fewer, higher-quality trades often work better.`,
    };
  }

  // Returning after absence
  if (daysInactive >= 3) {
    return {
      id: "daily-welcome-back",
      severity: "info",
      message: "Welcome back! Start small today to get back in the groove.",
    };
  }

  // Day of week tips
  if (dayOfWeek === 1) {
    return {
      id: "daily-monday",
      severity: "info",
      message: "Monday tip: Markets can be volatile at the open. Consider waiting 15-20 min after 9:15 before entering.",
    };
  }
  if (dayOfWeek === 5) {
    return {
      id: "daily-friday",
      severity: "info",
      message: "Friday tip: Unwind positions before 3:00 PM to avoid weekend risk.",
    };
  }

  return null;
}

// --------------- Stock Holding Tips ---------------

export function getHoldingTips(holding: {
  unrealizedPnlPct: number;
  buyDate: string;
  investedValue: number;
  totalPortfolioValue?: number;
}): BuddyTip[] {
  const tips: BuddyTip[] = [];
  const daysSinceBuy = Math.floor(
    (Date.now() - new Date(holding.buyDate).getTime()) / 86400000
  );
  const isLongTerm = daysSinceBuy > 365;

  if (holding.unrealizedPnlPct >= 100) {
    tips.push({
      id: "holding-doubled",
      severity: "success",
      message:
        "This stock has doubled! You might want to sell half and keep the rest risk-free.",
    });
  } else if (holding.unrealizedPnlPct >= 50) {
    tips.push({
      id: "holding-up-big",
      severity: "success",
      message: `Up ${Math.round(holding.unrealizedPnlPct)}%! Consider booking some profits.`,
    });
  }

  if (holding.unrealizedPnlPct <= -30) {
    tips.push({
      id: "holding-down-big",
      severity: "danger",
      message:
        "Down more than 30%. Is your original reason for buying still valid? Consider cutting losses.",
    });
  }

  if (isLongTerm && holding.unrealizedPnlPct > 0) {
    tips.push({
      id: "holding-ltcg",
      severity: "info",
      message:
        "Held for over 1 year — gains are taxed at just 10% (LTCG) instead of 15% (STCG). Good patience!",
    });
  } else if (!isLongTerm && holding.unrealizedPnlPct > 15 && daysSinceBuy > 30) {
    const daysToLTCG = 365 - daysSinceBuy;
    tips.push({
      id: "holding-stcg-warning",
      severity: "info",
      message: `Selling now means 15% tax on gains (STCG). Hold ${daysToLTCG} more days for the lower 10% tax rate.`,
    });
  }

  if (
    holding.totalPortfolioValue &&
    holding.totalPortfolioValue > 0 &&
    holding.investedValue / holding.totalPortfolioValue > 0.3
  ) {
    tips.push({
      id: "holding-concentrated",
      severity: "warning",
      message: `This is ${Math.round((holding.investedValue / holding.totalPortfolioValue) * 100)}% of your portfolio. Diversifying reduces risk.`,
    });
  }

  return tips;
}

export function getHoldingFormTips(params: {
  quantity: string;
  buyPrice: string;
  context: { capitalAmount: number; holdingCount: number } | null;
}): BuddyTip[] {
  const tips: BuddyTip[] = [];
  const qty = parseFloat(params.quantity) || 0;
  const price = parseFloat(params.buyPrice) || 0;
  const ctx = params.context;

  if (ctx && price > 0 && qty > 0) {
    const value = price * qty;
    const pct = (value / ctx.capitalAmount) * 100;
    if (ctx.capitalAmount > 0 && pct > 20) {
      tips.push({
        id: "holding-form-large",
        severity: "warning",
        message: `This is ${Math.round(pct)}% of your capital (${fmt(value)}). Diversifying across multiple stocks reduces risk.`,
      });
    }
  }

  if (ctx && ctx.holdingCount >= 10) {
    tips.push({
      id: "holding-form-many",
      severity: "info",
      message:
        "You have 10+ holdings already. Make sure you can track all of them effectively.",
    });
  }

  return tips;
}

// --------------- Mutual Fund Tips ---------------

export function getMfTips(fund: {
  unrealizedPnlPct: number;
  category: string | null;
  isSip: boolean;
  createdAt: string;
}): BuddyTip[] {
  const tips: BuddyTip[] = [];
  const daysSinceInvest = Math.floor(
    (Date.now() - new Date(fund.createdAt).getTime()) / 86400000
  );
  const isEquity = fund.category
    ? ["equity", "elss", "index fund"].includes(fund.category.toLowerCase())
    : false;

  if (fund.unrealizedPnlPct <= -10 && isEquity) {
    tips.push({
      id: "mf-equity-down",
      severity: "info",
      message:
        "Down 10%. Equity funds fluctuate — if your goals are 3+ years away, stay invested.",
    });
  }

  if (fund.unrealizedPnlPct >= 30) {
    tips.push({
      id: "mf-up-big",
      severity: "success",
      message:
        "Great returns! If this was for a short-term goal, consider redeeming.",
    });
  }

  if (
    fund.category?.toLowerCase() === "elss" &&
    daysSinceInvest > 365 * 3
  ) {
    tips.push({
      id: "mf-elss-unlocked",
      severity: "info",
      message:
        "Your ELSS lock-in period (3 years) is over. You can redeem if needed.",
    });
  }

  if (fund.isSip) {
    tips.push({
      id: "mf-sip-active",
      severity: "success",
      message:
        "SIP is great — you're averaging out your purchase price automatically.",
    });
  } else if (isEquity) {
    tips.push({
      id: "mf-no-sip",
      severity: "info",
      message:
        "Consider starting a SIP. Investing a fixed amount monthly reduces timing risk.",
    });
  }

  return tips;
}

export function getMfFormTips(params: {
  investedAmount: string;
  context: { totalMfInvested: number; mfCount: number } | null;
}): BuddyTip[] {
  const tips: BuddyTip[] = [];
  const amount = parseFloat(params.investedAmount) || 0;
  const ctx = params.context;

  if (ctx && ctx.mfCount === 0) {
    tips.push({
      id: "mf-form-first",
      severity: "success",
      message:
        "Great first step! Mutual funds are a good way to start investing.",
    });
  }

  if (ctx && amount > 0 && ctx.totalMfInvested > 0) {
    const totalAfter = ctx.totalMfInvested + amount;
    const pct = (amount / totalAfter) * 100;
    if (pct > 50) {
      tips.push({
        id: "mf-form-concentrated",
        severity: "warning",
        message:
          "Putting too much in one fund is risky. Spread across 3-4 funds.",
      });
    }
  }

  return tips;
}
