import { prisma } from "@/lib/prisma";
import { PriceCacheEntry } from "@/types";
import { GrowwAdapter } from "@/lib/broker/groww";

const CACHE_TTL_SECONDS = 60; // 60s to avoid Yahoo rate limits
const YAHOO_FINANCE_URLS = [
  "https://query2.finance.yahoo.com/v8/finance/chart",
  "https://query1.finance.yahoo.com/v8/finance/chart",
];

function isPriceFresh(updatedAt: Date, ttlSeconds = CACHE_TTL_SECONDS): boolean {
  const age = (Date.now() - updatedAt.getTime()) / 1000;
  return age < ttlSeconds;
}

export async function getCachedPrice(
  symbol: string
): Promise<PriceCacheEntry | null> {
  const cached = await prisma.priceCache.findUnique({
    where: { symbol },
  });

  if (cached && isPriceFresh(cached.updatedAt)) {
    return {
      symbol: cached.symbol,
      price: cached.price,
      change: cached.change,
      changePct: cached.changePct,
      volume: cached.volume,
      source: cached.source,
      updatedAt: cached.updatedAt,
    };
  }

  return refreshPrice(symbol);
}

export async function getCachedPrices(
  symbols: string[],
  userId?: string
): Promise<Map<string, PriceCacheEntry>> {
  const result = new Map<string, PriceCacheEntry>();
  if (symbols.length === 0) return result;

  // Check cache for all symbols
  const cached = await prisma.priceCache.findMany({
    where: { symbol: { in: symbols } },
  });

  const staleSymbols: string[] = [];

  for (const entry of cached) {
    if (isPriceFresh(entry.updatedAt)) {
      result.set(entry.symbol, {
        symbol: entry.symbol,
        price: entry.price,
        change: entry.change,
        changePct: entry.changePct,
        volume: entry.volume,
        source: entry.source,
        updatedAt: entry.updatedAt,
      });
    } else {
      staleSymbols.push(entry.symbol);
    }
  }

  // Find symbols not in cache at all
  const cachedSymbols = new Set(cached.map((c) => c.symbol));
  for (const sym of symbols) {
    if (!cachedSymbols.has(sym)) {
      staleSymbols.push(sym);
    }
  }

  // Batch-fetch stale symbols
  if (staleSymbols.length > 0) {
    console.log("[PriceCache] Stale/missing symbols:", staleSymbols);

    // Try Groww API first if user has credentials (no rate limit on paid plan)
    const growwResult = userId
      ? await fetchFromGroww(staleSymbols, userId)
      : new Map<string, PriceCacheEntry>();

    if (growwResult.size > 0) {
      console.log("[PriceCache] Groww returned prices for:", [...growwResult.keys()]);
    }

    const remaining = staleSymbols.filter((s) => !growwResult.has(s));
    for (const [sym, entry] of growwResult) {
      result.set(sym, entry);
    }

    // Fall back to Yahoo Finance (free, no API key needed)
    if (remaining.length > 0) {
      console.log("[PriceCache] Fetching from Yahoo Finance for:", remaining);
      const refreshed = await batchFetchFromYahoo(remaining);
      console.log("[PriceCache] Yahoo Finance returned:", [...refreshed.keys()]);
      for (const [sym, entry] of refreshed) {
        result.set(sym, entry);
      }
    }
  } else {
    console.log("[PriceCache] All symbols fresh from cache");
  }

  return result;
}

export async function refreshPrice(
  symbol: string
): Promise<PriceCacheEntry | null> {
  const refreshed = await batchFetchFromYahoo([symbol]);
  return refreshed.get(symbol) || null;
}

/**
 * Try to fetch prices from Groww API using the user's credentials.
 * Falls back silently if credentials don't exist or API fails.
 */
async function fetchFromGroww(
  symbols: string[],
  userId: string
): Promise<Map<string, PriceCacheEntry>> {
  const result = new Map<string, PriceCacheEntry>();

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        growwApiKey: true,
        growwAccessToken: true,
        growwTokenExpiry: true,
      },
    });

    if (!user?.growwApiKey || !user?.growwAccessToken) {
      return result;
    }
    if (user.growwTokenExpiry && new Date(user.growwTokenExpiry) < new Date()) {
      console.log("[PriceCache] Groww skipped: token expired");
      return result;
    }

    const adapter = new GrowwAdapter(user.growwApiKey, user.growwAccessToken);
    const quotes = await adapter.getLivePrices(symbols);

    for (const quote of quotes) {
      const cached = await prisma.priceCache.upsert({
        where: { symbol: quote.symbol },
        update: {
          price: quote.price,
          change: quote.change,
          changePct: quote.changePct,
          volume: quote.volume,
          source: "groww",
        },
        create: {
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          changePct: quote.changePct,
          volume: quote.volume,
          source: "groww",
        },
      });

      result.set(quote.symbol, {
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePct: quote.changePct,
        volume: quote.volume,
        source: "groww",
        updatedAt: cached.updatedAt,
      });
    }
  } catch (error) {
    console.error("[PriceCache] Groww fetch error:", error);
  }

  return result;
}

/**
 * Fetch live prices from Yahoo Finance (free, no API key).
 * Uses the chart endpoint which returns real-time NSE data.
 * Symbol format: RELIANCE → RELIANCE.NS for Yahoo
 */
async function batchFetchFromYahoo(
  symbols: string[]
): Promise<Map<string, PriceCacheEntry>> {
  const result = new Map<string, PriceCacheEntry>();
  if (symbols.length === 0) return result;

  // Yahoo Finance doesn't support batch — fetch in parallel (up to 5 at a time)
  const batchSize = 5;

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const fetches = batch.map((sym) => fetchYahooQuote(sym));
    const results = await Promise.allSettled(fetches);

    for (let j = 0; j < batch.length; j++) {
      const settled = results[j];
      if (settled.status === "fulfilled" && settled.value) {
        const entry = settled.value;
        result.set(batch[j], entry);
      }
    }
  }

  return result;
}

async function fetchYahooQuote(
  symbol: string
): Promise<PriceCacheEntry | null> {
  try {
    // NSE stocks use .NS suffix on Yahoo Finance
    const yahooSymbol = `${symbol}.NS`;

    let data = null;
    for (const base of YAHOO_FINANCE_URLS) {
      const url = `${base}/${yahooSymbol}?interval=1d&range=1d`;
      try {
        const res = await fetch(url, {
          next: { revalidate: 0 },
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          console.warn(`[Yahoo] HTTP ${res.status} from ${base} for ${symbol}`);
          continue;
        }

        data = await res.json();
        break;
      } catch (err) {
        console.warn(`[Yahoo] Fetch failed from ${base} for ${symbol}:`, (err as Error).message);
      }
    }

    if (!data) {
      console.error(`[Yahoo] All endpoints failed for ${symbol}`);
      return null;
    }
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta || !meta.regularMarketPrice) {
      console.error(`[Yahoo] No market data for ${symbol}`);
      return null;
    }

    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - previousClose;
    const changePct = previousClose > 0 ? (change / previousClose) * 100 : 0;
    const volume = meta.regularMarketVolume || 0;

    console.log(`[Yahoo] ${symbol}: ₹${price} (${change >= 0 ? "+" : ""}${change.toFixed(2)}, ${changePct.toFixed(2)}%)`);

    // Upsert into cache
    const cached = await prisma.priceCache.upsert({
      where: { symbol },
      update: {
        price,
        change: Math.round(change * 100) / 100,
        changePct: Math.round(changePct * 100) / 100,
        volume,
        source: "yahoo",
      },
      create: {
        symbol,
        price,
        change: Math.round(change * 100) / 100,
        changePct: Math.round(changePct * 100) / 100,
        volume,
        source: "yahoo",
      },
    });

    return {
      symbol,
      price,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
      volume,
      source: "yahoo",
      updatedAt: cached.updatedAt,
    };
  } catch (error) {
    console.error(`[Yahoo] Fetch error for ${symbol}:`, error);
    return null;
  }
}
