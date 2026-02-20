import { StockQuote } from "@/types";

const TWELVE_DATA_BASE = "https://api.twelvedata.com";

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    console.error("TWELVE_DATA_API_KEY not set");
    return null;
  }

  try {
    const res = await fetch(
      `${TWELVE_DATA_BASE}/quote?symbol=${symbol}&exchange=NSE&apikey=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();

    if (data.status === "error") {
      console.error("Twelve Data error:", data.message);
      return null;
    }

    return {
      symbol: data.symbol,
      name: data.name,
      price: parseFloat(data.close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      volume: parseInt(data.volume),
    };
  } catch (error) {
    console.error("Market data fetch error:", error);
    return null;
  }
}

export async function searchStocks(
  query: string
): Promise<{ symbol: string; name: string; exchange: string }[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `${TWELVE_DATA_BASE}/symbol_search?symbol=${query}&exchange=NSE&apikey=${apiKey}`
    );
    const data = await res.json();

    if (!data.data) return [];

    return data.data
      .filter(
        (item: { exchange: string }) =>
          item.exchange === "NSE" || item.exchange === "BSE"
      )
      .slice(0, 10)
      .map((item: { symbol: string; instrument_name: string; exchange: string }) => ({
        symbol: item.symbol,
        name: item.instrument_name,
        exchange: item.exchange,
      }));
  } catch (error) {
    console.error("Stock search error:", error);
    return [];
  }
}

// Popular NSE stocks for suggestions
export const POPULAR_NSE_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "INFY", name: "Infosys" },
  { symbol: "ICICIBANK", name: "ICICI Bank" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever" },
  { symbol: "ITC", name: "ITC Limited" },
  { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank" },
  { symbol: "LT", name: "Larsen & Toubro" },
  { symbol: "AXISBANK", name: "Axis Bank" },
  { symbol: "WIPRO", name: "Wipro" },
  { symbol: "TATAMOTORS", name: "Tata Motors" },
  { symbol: "SUNPHARMA", name: "Sun Pharma" },
  { symbol: "MARUTI", name: "Maruti Suzuki" },
  { symbol: "ONGC", name: "ONGC" },
  { symbol: "NTPC", name: "NTPC" },
  { symbol: "TATASTEEL", name: "Tata Steel" },
  { symbol: "POWERGRID", name: "Power Grid Corp" },
];
