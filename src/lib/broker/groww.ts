import {
  BrokerAdapter,
  BrokerHolding,
  BrokerPosition,
  BrokerTrade,
  BrokerQuote,
} from "./types";

const GROWW_API_BASE = "https://api.groww.in/v1";

/**
 * Groww Trading API adapter.
 *
 * Note: Groww's Trading API (₹499/month) requires OAuth setup.
 * This adapter implements the BrokerAdapter interface and can be
 * connected via the Settings page once Groww API credentials are provided.
 *
 * API Docs: https://groww.in/trade-api/docs
 */
export class GrowwAdapter implements BrokerAdapter {
  name = "Groww";
  private apiKey: string;
  private accessToken: string;

  constructor(apiKey: string, accessToken: string) {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${GROWW_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Groww API error (${res.status}): ${error}`);
    }

    return res.json();
  }

  getAuthUrl(): string {
    const redirectUri = process.env.GROWW_REDIRECT_URI || "http://localhost:3000/api/broker/groww/auth/callback";
    return `https://api.groww.in/v1/oauth/authorize?client_id=${this.apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  }

  async handleAuthCallback(code: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    const data = await this.request("/oauth/token", {
      method: "POST",
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: this.apiKey,
        client_secret: process.env.GROWW_API_SECRET,
        redirect_uri: process.env.GROWW_REDIRECT_URI,
      }),
    });

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async fetchHoldings(): Promise<BrokerHolding[]> {
    try {
      const data = await this.request("/portfolio/holdings");
      return (data.holdings || []).map(
        (h: {
          tradingSymbol: string;
          exchange: string;
          quantity: number;
          averagePrice: number;
          lastPrice: number;
          pnl: number;
        }) => ({
          symbol: h.tradingSymbol,
          exchange: h.exchange || "NSE",
          quantity: h.quantity,
          averagePrice: h.averagePrice,
          currentPrice: h.lastPrice,
          pnl: h.pnl,
        })
      );
    } catch (error) {
      console.error("Groww fetchHoldings error:", error);
      return [];
    }
  }

  async fetchPositions(): Promise<BrokerPosition[]> {
    try {
      const data = await this.request("/portfolio/positions");
      return (data.positions || []).map(
        (p: {
          tradingSymbol: string;
          exchange: string;
          side: string;
          quantity: number;
          averagePrice: number;
          lastPrice: number;
          pnl: number;
          orderId: string;
        }) => ({
          symbol: p.tradingSymbol,
          exchange: p.exchange || "NSE",
          side: p.side === "BUY" ? "BUY" : "SELL",
          quantity: p.quantity,
          entryPrice: p.averagePrice,
          currentPrice: p.lastPrice,
          pnl: p.pnl,
          orderId: p.orderId,
        })
      );
    } catch (error) {
      console.error("Groww fetchPositions error:", error);
      return [];
    }
  }

  async fetchTrades(fromDate: Date, toDate: Date): Promise<BrokerTrade[]> {
    try {
      const from = fromDate.toISOString().split("T")[0];
      const to = toDate.toISOString().split("T")[0];
      const data = await this.request(
        `/orders/history?from=${from}&to=${to}`
      );
      return (data.orders || [])
        .filter((o: { status: string }) => o.status === "EXECUTED")
        .map(
          (o: {
            tradingSymbol: string;
            exchange: string;
            side: string;
            quantity: number;
            price: number;
            executedAt: string;
            orderId: string;
          }) => ({
            symbol: o.tradingSymbol,
            exchange: o.exchange || "NSE",
            side: o.side === "BUY" ? "BUY" : "SELL",
            quantity: o.quantity,
            price: o.price,
            timestamp: new Date(o.executedAt),
            orderId: o.orderId,
          })
        );
    } catch (error) {
      console.error("Groww fetchTrades error:", error);
      return [];
    }
  }

  async getLivePrice(symbol: string): Promise<BrokerQuote | null> {
    try {
      const data = await this.request(`/market/quote?symbol=${symbol}`);
      return {
        symbol: data.symbol,
        price: data.lastPrice,
        change: data.change,
        changePct: data.changePct,
        volume: data.volume,
      };
    } catch {
      return null;
    }
  }

  async getLivePrices(symbols: string[]): Promise<BrokerQuote[]> {
    const results: BrokerQuote[] = [];
    for (const symbol of symbols) {
      const quote = await this.getLivePrice(symbol);
      if (quote) results.push(quote);
    }
    return results;
  }
}
