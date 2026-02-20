export interface BrokerAdapter {
  name: string;

  // Authentication
  getAuthUrl(): string;
  handleAuthCallback(code: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }>;

  // Portfolio
  fetchHoldings(): Promise<BrokerHolding[]>;
  fetchPositions(): Promise<BrokerPosition[]>;

  // Trade History
  fetchTrades(fromDate: Date, toDate: Date): Promise<BrokerTrade[]>;

  // Live Prices
  getLivePrice(symbol: string): Promise<BrokerQuote | null>;
  getLivePrices(symbols: string[]): Promise<BrokerQuote[]>;
}

export interface BrokerHolding {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
}

export interface BrokerPosition {
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  orderId: string;
}

export interface BrokerTrade {
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  timestamp: Date;
  orderId: string;
}

export interface BrokerQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
}
