"use client";

import { useState, useEffect } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/charges";

interface NetWorthData {
  capitalAmount: number;
  holdingsValue: number;
  holdingsPnl: number;
  fundsValue: number;
  fundsPnl: number;
}

export function NetWorthCard({
  capitalAmount,
  holdingsCount,
  fundsCount,
}: {
  capitalAmount: number;
  holdingsCount: number;
  fundsCount: number;
}) {
  const [data, setData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [holdingsRes, fundsRes] = await Promise.all([
          holdingsCount > 0 ? fetch("/api/holdings") : null,
          fundsCount > 0 ? fetch("/api/mutual-funds") : null,
        ]);

        const holdingsData = holdingsRes ? await holdingsRes.json() : null;
        const fundsData = fundsRes ? await fundsRes.json() : null;

        setData({
          capitalAmount,
          holdingsValue: holdingsData?.totalCurrentValue || 0,
          holdingsPnl: holdingsData?.totalPnl || 0,
          fundsValue: fundsData?.totalCurrentValue || 0,
          fundsPnl: fundsData?.totalReturns || 0,
        });
      } catch (error) {
        console.error("Failed to fetch net worth:", error);
      }
      setLoading(false);
    }

    fetchData();
  }, [capitalAmount, holdingsCount, fundsCount]);

  if (loading) {
    return (
      <Card className="col-span-2 border-emerald-200 dark:border-emerald-900">
        <CardContent className="pt-6 pb-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalNetWorth =
    capitalAmount +
    (data?.holdingsValue || 0) +
    (data?.fundsValue || 0);
  const totalInvested =
    capitalAmount +
    (data?.holdingsValue || 0) -
    (data?.holdingsPnl || 0) +
    (data?.fundsValue || 0) -
    (data?.fundsPnl || 0);
  const totalPnl = (data?.holdingsPnl || 0) + (data?.fundsPnl || 0);
  const totalPnlPct =
    totalInvested > 0
      ? Math.round((totalPnl / (totalInvested - capitalAmount || 1)) * 10000) / 100
      : 0;
  const hasInvestments = holdingsCount > 0 || fundsCount > 0;

  return (
    <Card className="col-span-full lg:col-span-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20">
      <CardContent className="pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-medium text-muted-foreground">
                Total Net Worth
              </p>
            </div>
            <p className="text-3xl font-bold">{formatINR(totalNetWorth)}</p>
            {hasInvestments && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>
                  Capital: {formatINR(capitalAmount)}
                </span>
                {(data?.holdingsValue || 0) > 0 && (
                  <span>Stocks: {formatINR(data?.holdingsValue || 0)}</span>
                )}
                {(data?.fundsValue || 0) > 0 && (
                  <span>MF: {formatINR(data?.fundsValue || 0)}</span>
                )}
              </div>
            )}
          </div>
          {hasInvestments && totalPnl !== 0 && (
            <div className="text-right">
              <p
                className={`text-lg font-bold ${
                  totalPnl >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {totalPnl >= 0 ? "+" : ""}
                {formatINR(totalPnl)}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalPnlPct >= 0 ? "+" : ""}
                {totalPnlPct}% investment returns
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
