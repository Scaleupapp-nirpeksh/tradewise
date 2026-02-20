import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_SMS_FROM || "";

export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  try {
    await client.messages.create({
      body: message,
      from: FROM,
      to,
    });

    return true;
  } catch (error) {
    console.error("SMS send error:", error);
    return false;
  }
}

export function formatLossAlert(
  symbol: string,
  loss: number,
  currentPrice: number,
  entryPrice: number
): string {
  const lossFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Math.abs(loss));

  return [
    `LOSS ALERT`,
    ``,
    `Your position in ${symbol} is down.`,
    ``,
    `Entry: Rs${entryPrice.toFixed(2)}`,
    `Current: Rs${currentPrice.toFixed(2)}`,
    `Unrealized Loss: ${lossFormatted}`,
    ``,
    `Consider reviewing this position. Stay disciplined!`,
  ].join("\n");
}

export function formatDailySummary(data: {
  totalTrades: number;
  winners: number;
  losers: number;
  netPnl: number;
  winRate: number;
}): string {
  const pnlFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(data.netPnl);

  return [
    `Daily Trading Summary`,
    ``,
    `Total Trades: ${data.totalTrades}`,
    `Winners: ${data.winners} | Losers: ${data.losers}`,
    `Win Rate: ${data.winRate.toFixed(1)}%`,
    `Net P&L: ${pnlFormatted}`,
    ``,
    data.netPnl >= 0 ? `Great day! Keep it up!` : `Tomorrow is a new day. Review and learn.`,
  ].join("\n");
}

export function formatAiSuggestion(data: {
  symbol: string;
  action: string;
  entry: number;
  target: number;
  stopLoss: number;
  reasoning: string;
}): string {
  return [
    `AI Trade Suggestion`,
    ``,
    `${data.action} ${data.symbol}`,
    ``,
    `Entry: Rs${data.entry.toFixed(2)}`,
    `Target: Rs${data.target.toFixed(2)}`,
    `Stop Loss: Rs${data.stopLoss.toFixed(2)}`,
    ``,
    `Why? ${data.reasoning}`,
    ``,
    `This is AI-generated. Always do your own research.`,
  ].join("\n");
}
