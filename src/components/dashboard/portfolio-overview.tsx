"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  PiggyBank,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioData {
  holdingsCount: number;
  holdingsInvested: number;
  holdingsCurrentValue: number;
  holdingsPnl: number;
  fundsCount: number;
  fundsInvested: number;
  fundsCurrentValue: number;
  fundsPnl: number;
}

export function PortfolioOverview({
  holdingsCount: initialHoldings,
  fundsCount: initialFunds,
}: {
  holdingsCount: number;
  fundsCount: number;
}) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const [holdingsRes, fundsRes] = await Promise.all([
          initialHoldings > 0 ? fetch("/api/holdings") : null,
          initialFunds > 0 ? fetch("/api/mutual-funds") : null,
        ]);

        const holdingsData = holdingsRes ? await holdingsRes.json() : null;
        const fundsData = fundsRes ? await fundsRes.json() : null;

        setData({
          holdingsCount: holdingsData?.holdings?.length || 0,
          holdingsInvested: holdingsData?.totalInvested || 0,
          holdingsCurrentValue: holdingsData?.totalCurrentValue || 0,
          holdingsPnl: holdingsData?.totalPnl || 0,
          fundsCount: fundsData?.funds?.length || 0,
          fundsInvested: fundsData?.totalInvested || 0,
          fundsCurrentValue: fundsData?.totalCurrentValue || 0,
          fundsPnl: fundsData?.totalReturns || 0,
        });
      } catch (error) {
        console.error("Failed to fetch portfolio:", error);
      }
      setLoading(false);
    }

    if (initialHoldings > 0 || initialFunds > 0) {
      fetchPortfolio();
    } else {
      setLoading(false);
    }
  }, [initialHoldings, initialFunds]);

  if (!loading && !data) return null;
  if (!loading && data && data.holdingsCount === 0 && data.fundsCount === 0)
    return null;

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const totalInvested =
    (data?.holdingsInvested || 0) + (data?.fundsInvested || 0);
  const totalCurrent =
    (data?.holdingsCurrentValue || 0) + (data?.fundsCurrentValue || 0);
  const totalPnl = (data?.holdingsPnl || 0) + (data?.fundsPnl || 0);
  const totalPnlPct =
    totalInvested > 0
      ? Math.round((totalPnl / totalInvested) * 10000) / 100
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Portfolio Overview</CardTitle>
        <p className="text-xs text-muted-foreground">
          Your long-term investments at a glance
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
            <p className="text-xs">Loading portfolio...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Portfolio Value
                </p>
                <p className="text-2xl font-bold">{formatINR(totalCurrent)}</p>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-semibold ${totalPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {totalPnl >= 0 ? "+" : ""}
                  {formatINR(totalPnl)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalPnlPct >= 0 ? "+" : ""}
                  {totalPnlPct}% returns
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data && data.holdingsCount > 0 && (
                <Link href="/dashboard/stocks">
                  <div className="rounded-lg p-3 border hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        Stocks ({data.holdingsCount})
                      </span>
                    </div>
                    <p className="text-sm">
                      {formatINR(data.holdingsCurrentValue)}
                    </p>
                    <p
                      className={`text-xs ${data.holdingsPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {data.holdingsPnl >= 0 ? "+" : ""}
                      {formatINR(data.holdingsPnl)}
                    </p>
                  </div>
                </Link>
              )}
              {data && data.fundsCount > 0 && (
                <Link href="/dashboard/mutual-funds">
                  <div className="rounded-lg p-3 border hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <PiggyBank className="h-4 w-4 text-violet-600" />
                      <span className="text-sm font-medium">
                        Mutual Funds ({data.fundsCount})
                      </span>
                    </div>
                    <p className="text-sm">
                      {formatINR(data.fundsCurrentValue)}
                    </p>
                    <p
                      className={`text-xs ${data.fundsPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {data.fundsPnl >= 0 ? "+" : ""}
                      {formatINR(data.fundsPnl)}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
