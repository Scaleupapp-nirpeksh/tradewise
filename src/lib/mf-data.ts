import { MfSearchResult } from "@/types";

// In-memory cache for all mutual fund scheme names
let allFunds: MfSearchResult[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch all mutual fund schemes from AMFI API.
 * Results are cached in memory for 24 hours.
 */
async function loadAllFunds(): Promise<MfSearchResult[]> {
  if (allFunds.length > 0 && Date.now() - lastFetchTime < CACHE_DURATION) {
    return allFunds;
  }

  try {
    const res = await fetch("https://api.mfapi.in/mf", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return allFunds;

    const data = await res.json();
    // AMFI API returns schemeCode as number — normalize to string
    allFunds = data.map((f: { schemeCode: number | string; schemeName: string }) => ({
      schemeCode: String(f.schemeCode),
      schemeName: f.schemeName,
    }));
    lastFetchTime = Date.now();
    return allFunds;
  } catch (error) {
    console.error("Failed to fetch MF list:", error);
    return allFunds;
  }
}

/**
 * Search mutual funds by name. Returns top 15 matches.
 */
export async function searchMutualFunds(
  query: string
): Promise<MfSearchResult[]> {
  const funds = await loadAllFunds();
  if (!query || query.length < 2) return [];

  const upper = query.toUpperCase();
  const results: MfSearchResult[] = [];

  for (const fund of funds) {
    if (fund.schemeName.toUpperCase().includes(upper)) {
      results.push(fund);
      if (results.length >= 15) break;
    }
  }

  return results;
}

/**
 * Fetch latest NAV for a specific mutual fund scheme.
 */
export async function getLatestNav(
  schemeCode: string
): Promise<{ nav: number; date: string } | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;

    const latest = data.data[0];
    return {
      nav: parseFloat(latest.nav),
      date: latest.date,
    };
  } catch (error) {
    console.error(`Failed to fetch NAV for ${schemeCode}:`, error);
    return null;
  }
}
