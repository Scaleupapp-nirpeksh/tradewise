export interface ChargeBreakdown {
  brokerage: number;
  stt: number;
  exchangeCharges: number;
  gst: number;
  sebiCharges: number;
  stampDuty: number;
  totalCharges: number;
}

export interface BrokerChargeProfile {
  type: "flat" | "percentage";
  flatFee: number;
  percentage: number;
  maxBrokerage: number;
}

export interface TradeFormData {
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  entryTime: string;
  exitTime?: string;
  targetPrice?: number;
  stopLossPrice?: number;
  strategyId?: string;
  notes?: string;
  emotionTag?: string;
  setupRating?: string;
}

export interface AiSuggestionData {
  symbol: string;
  action: "BUY" | "SELL";
  suggestedEntry: number;
  suggestedTarget: number;
  suggestedStopLoss: number;
  reasoning: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface DashboardStats {
  todayPnl: number;
  todayTrades: number;
  todayWinRate: number;
  openPositions: number;
  totalCapital: number;
  weeklyPnl: number;
  biggestWin: number;
  biggestLoss: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface PriceCacheEntry {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  source: string;
  updatedAt: Date;
}

export interface OpenPositionWithLive {
  id: string;
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  entryTime: string;
  targetPrice: number | null;
  stopLossPrice: number | null;
  strategyName: string | null;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  distanceToTarget: number | null;
  distanceToStopLoss: number | null;
}

export interface PositionAdviceData {
  tradeId: string;
  action: "HOLD" | "SELL" | "BUY_MORE";
  currentPrice: number;
  reasoning: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface TradingGoalData {
  type: "NET_PNL" | "WIN_RATE" | "MAX_LOSS_PER_TRADE" | "TOTAL_TRADES";
  targetValue: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  startDate: string;
  endDate: string;
}

export interface RiskCalculation {
  positionSize: number;
  capitalRequired: number;
  maxLoss: number;
  potentialProfit: number;
  riskRewardRatio: number;
  capitalPercentage: number;
  riskPercentage: number;
}
