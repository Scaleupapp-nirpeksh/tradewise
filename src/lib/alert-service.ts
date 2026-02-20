import { prisma } from "@/lib/prisma";
import { getCachedPrices } from "@/lib/price-cache";
import { sendSMS } from "@/lib/sms";
import { getISTMidnight } from "@/lib/market-hours";

type AlertType = "LOSS_LIMIT" | "POSITION_ALERT" | "AI_SUGGESTION" | "DAILY_SUMMARY";

export async function hasAlertBeenSentToday(
  userId: string,
  type: AlertType,
  tradeId?: string
): Promise<boolean> {
  const todayIST = getISTMidnight();

  const where: Record<string, unknown> = {
    userId,
    type,
    sentAt: { gte: todayIST },
  };
  if (tradeId) where.tradeId = tradeId;

  const count = await prisma.alertLog.count({ where });
  return count > 0;
}

async function sendAlertSMS(
  userId: string,
  phone: string,
  type: AlertType,
  message: string,
  tradeId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const delivered = await sendSMS(phone, message);

  await prisma.alertLog.create({
    data: {
      userId,
      type,
      message,
      delivered,
      tradeId: tradeId || null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    },
  });
}

export async function checkPriceAlerts(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      smsAlertsEnabled: true,
      priceAlertThreshold: true,
    },
  });

  if (!user || !user.smsAlertsEnabled) return;

  const threshold = user.priceAlertThreshold || 1.0;

  // Get open trades with targets or stop losses set
  const openTrades = await prisma.trade.findMany({
    where: {
      userId,
      status: "OPEN",
      OR: [
        { targetPrice: { not: null } },
        { stopLossPrice: { not: null } },
      ],
    },
  });

  if (openTrades.length === 0) return;

  const symbols = [...new Set(openTrades.map((t) => t.symbol))];
  const prices = await getCachedPrices(symbols);

  for (const trade of openTrades) {
    const priceData = prices.get(trade.symbol);
    if (!priceData) continue;

    const currentPrice = priceData.price;

    // Check target price
    if (trade.targetPrice) {
      const distancePct =
        Math.abs(currentPrice - trade.targetPrice) / trade.targetPrice * 100;

      if (distancePct <= threshold) {
        const alreadySent = await hasAlertBeenSentToday(
          userId,
          "POSITION_ALERT",
          trade.id
        );
        if (!alreadySent) {
          const msg = formatTargetApproachingAlert(
            trade.symbol,
            currentPrice,
            trade.targetPrice
          );
          await sendAlertSMS(userId, user.phone, "POSITION_ALERT", msg, trade.id, {
            alertKind: "target_approaching",
            currentPrice,
            targetPrice: trade.targetPrice,
          });
        }
      }
    }

    // Check stop loss
    if (trade.stopLossPrice) {
      const distancePct =
        Math.abs(currentPrice - trade.stopLossPrice) / trade.stopLossPrice * 100;

      // Breached stop loss
      const breached =
        trade.side === "BUY"
          ? currentPrice <= trade.stopLossPrice
          : currentPrice >= trade.stopLossPrice;

      if (breached) {
        const alreadySent = await hasAlertBeenSentToday(
          userId,
          "POSITION_ALERT",
          trade.id
        );
        if (!alreadySent) {
          const msg = formatStopLossBreachedAlert(
            trade.symbol,
            currentPrice,
            trade.stopLossPrice
          );
          await sendAlertSMS(userId, user.phone, "POSITION_ALERT", msg, trade.id, {
            alertKind: "stop_loss_breached",
            currentPrice,
            stopLossPrice: trade.stopLossPrice,
          });
        }
      } else if (distancePct <= threshold) {
        const alreadySent = await hasAlertBeenSentToday(
          userId,
          "POSITION_ALERT",
          trade.id
        );
        if (!alreadySent) {
          const msg = formatStopLossApproachingAlert(
            trade.symbol,
            currentPrice,
            trade.stopLossPrice
          );
          await sendAlertSMS(userId, user.phone, "POSITION_ALERT", msg, trade.id, {
            alertKind: "stop_loss_approaching",
            currentPrice,
            stopLossPrice: trade.stopLossPrice,
          });
        }
      }
    }
  }
}

export async function checkDailyLossLimit(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, smsAlertsEnabled: true, dailyLossLimit: true },
  });

  if (!user || !user.smsAlertsEnabled) return;

  const alreadySent = await hasAlertBeenSentToday(userId, "LOSS_LIMIT");
  if (alreadySent) return;

  const todayIST = getISTMidnight();

  const todayClosed = await prisma.trade.findMany({
    where: {
      userId,
      status: "CLOSED",
      createdAt: { gte: todayIST },
    },
    select: { netPnl: true },
  });

  const dailyLoss = todayClosed.reduce((sum, t) => sum + (t.netPnl || 0), 0);

  if (dailyLoss < 0 && Math.abs(dailyLoss) >= user.dailyLossLimit) {
    const msg = formatDailyLossLimitAlert(Math.abs(dailyLoss), user.dailyLossLimit);
    await sendAlertSMS(userId, user.phone, "LOSS_LIMIT", msg, undefined, {
      currentLoss: dailyLoss,
      limit: user.dailyLossLimit,
    });
  }
}

// Message formatters
function formatTargetApproachingAlert(
  symbol: string,
  currentPrice: number,
  targetPrice: number
): string {
  return `TARGET ALERT: ${symbol}

Current Price: Rs${currentPrice.toFixed(2)}
Your Target: Rs${targetPrice.toFixed(2)}

The stock is very close to your target price. Consider booking profits.

- TradeWise`;
}

function formatStopLossApproachingAlert(
  symbol: string,
  currentPrice: number,
  stopLossPrice: number
): string {
  return `STOP LOSS WARNING: ${symbol}

Current Price: Rs${currentPrice.toFixed(2)}
Your Stop Loss: Rs${stopLossPrice.toFixed(2)}

The stock is approaching your stop loss. Review your position.

- TradeWise`;
}

function formatStopLossBreachedAlert(
  symbol: string,
  currentPrice: number,
  stopLossPrice: number
): string {
  return `STOP LOSS HIT: ${symbol}

Current Price: Rs${currentPrice.toFixed(2)}
Your Stop Loss: Rs${stopLossPrice.toFixed(2)}

Your stop loss has been breached! Exit immediately to limit further losses.

- TradeWise`;
}

function formatDailyLossLimitAlert(
  currentLoss: number,
  limit: number
): string {
  return `DAILY LOSS LIMIT EXCEEDED

Your losses today: Rs${currentLoss.toFixed(0)}
Your daily limit: Rs${limit.toFixed(0)}

STOP TRADING. Take a break. Revenge trading will make it worse.

- TradeWise`;
}
