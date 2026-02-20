import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLatestNav } from "@/lib/mf-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ schemeCode: string }> }
) {
  const { schemeCode } = await params;

  if (!schemeCode) {
    return NextResponse.json({ error: "Scheme code required" }, { status: 400 });
  }

  try {
    // Check cache first (NavCache model)
    const cached = await prisma.navCache.findUnique({
      where: { schemeCode },
    });

    const now = new Date();
    const cacheAge = cached
      ? (now.getTime() - cached.updatedAt.getTime()) / 1000
      : Infinity;

    // Cache is fresh if less than 6 hours old
    if (cached && cacheAge < 21600) {
      return NextResponse.json({
        nav: cached.nav,
        date: cached.date,
        source: "cache",
      });
    }

    // Fetch fresh NAV from AMFI API
    const navData = await getLatestNav(schemeCode);

    if (!navData) {
      // Return cached data if API fails
      if (cached) {
        return NextResponse.json({
          nav: cached.nav,
          date: cached.date,
          source: "stale_cache",
        });
      }
      return NextResponse.json({ error: "NAV not found" }, { status: 404 });
    }

    // Update cache
    await prisma.navCache.upsert({
      where: { schemeCode },
      update: { nav: navData.nav, date: navData.date },
      create: { schemeCode, nav: navData.nav, date: navData.date },
    });

    return NextResponse.json({
      nav: navData.nav,
      date: navData.date,
      source: "api",
    });
  } catch (error) {
    console.error("NAV fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch NAV" },
      { status: 500 }
    );
  }
}
