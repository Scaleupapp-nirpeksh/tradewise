import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLatestNav } from "@/lib/mf-data";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const funds = await prisma.mutualFund.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (funds.length === 0) {
      return NextResponse.json({
        funds: [],
        totalInvested: 0,
        totalCurrentValue: 0,
        totalReturns: 0,
        activeSips: 0,
      });
    }

    // Fetch latest NAVs for all funds
    const navPromises = funds.map(async (f) => {
      // Check NavCache first
      const cached = await prisma.navCache.findUnique({
        where: { schemeCode: f.schemeCode },
      });
      const cacheAge = cached
        ? (Date.now() - cached.updatedAt.getTime()) / 1000
        : Infinity;

      if (cached && cacheAge < 21600) {
        return { schemeCode: f.schemeCode, nav: cached.nav };
      }

      const navData = await getLatestNav(f.schemeCode);
      if (navData) {
        // Update cache
        await prisma.navCache.upsert({
          where: { schemeCode: f.schemeCode },
          update: { nav: navData.nav, date: navData.date },
          create: {
            schemeCode: f.schemeCode,
            nav: navData.nav,
            date: navData.date,
          },
        });
        return { schemeCode: f.schemeCode, nav: navData.nav };
      }

      return {
        schemeCode: f.schemeCode,
        nav: cached?.nav || f.currentNav || 0,
      };
    });

    const navResults = await Promise.all(navPromises);
    const navMap = new Map(navResults.map((n) => [n.schemeCode, n.nav]));

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let activeSips = 0;

    const enriched = funds.map((f) => {
      const currentNav = navMap.get(f.schemeCode) || f.currentNav || 0;
      const currentValue = f.units * currentNav;
      const unrealizedPnl = currentValue - f.investedAmount;
      const unrealizedPnlPct =
        f.investedAmount > 0
          ? Math.round((unrealizedPnl / f.investedAmount) * 10000) / 100
          : 0;

      totalInvested += f.investedAmount;
      totalCurrentValue += currentValue;
      if (f.isSip) activeSips++;

      return {
        id: f.id,
        schemeName: f.schemeName,
        schemeCode: f.schemeCode,
        folioNumber: f.folioNumber,
        units: f.units,
        investedAmount: f.investedAmount,
        currentNav,
        currentValue: Math.round(currentValue * 100) / 100,
        unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
        unrealizedPnlPct,
        category: f.category,
        isSip: f.isSip,
        sipAmount: f.sipAmount,
        sipDate: f.sipDate,
        notes: f.notes,
        createdAt: f.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      funds: enriched,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalReturns:
        Math.round((totalCurrentValue - totalInvested) * 100) / 100,
      activeSips,
    });
  } catch (error) {
    console.error("Failed to fetch mutual funds:", error);
    return NextResponse.json(
      { error: "Failed to fetch mutual funds" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const {
      schemeName,
      schemeCode,
      folioNumber,
      units,
      investedAmount,
      category,
      isSip,
      sipAmount,
      sipDate,
      notes,
    } = body;

    if (!schemeName || !schemeCode || !units || !investedAmount) {
      return NextResponse.json(
        {
          error:
            "Fund name, scheme code, units, and invested amount are required",
        },
        { status: 400 }
      );
    }

    // Ensure schemeCode is a string (AMFI API returns it as a number)
    const schemeCodeStr = String(schemeCode);

    // Fetch current NAV
    const navData = await getLatestNav(schemeCodeStr);

    const fund = await prisma.mutualFund.create({
      data: {
        userId,
        schemeName,
        schemeCode: schemeCodeStr,
        folioNumber: folioNumber || null,
        units: parseFloat(units),
        investedAmount: parseFloat(investedAmount),
        currentNav: navData?.nav || 0,
        category: category || null,
        isSip: isSip || false,
        sipAmount: sipAmount ? parseFloat(sipAmount) : null,
        sipDate: sipDate ? parseInt(sipDate) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(fund, { status: 201 });
  } catch (error) {
    console.error("Failed to create mutual fund:", error);
    return NextResponse.json(
      { error: "Failed to add mutual fund" },
      { status: 500 }
    );
  }
}
