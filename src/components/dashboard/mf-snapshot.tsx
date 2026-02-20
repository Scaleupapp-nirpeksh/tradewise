"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  PiggyBank,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/charges";

interface Fund {
  id: string;
  schemeName: string;
  category: string | null;
  investedAmount: number;
  currentValue: number;
  currentNav: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  isSip: boolean;
  sipAmount: number | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  Equity: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Debt: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Hybrid: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  "ELSS (Tax Saver)": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  "Index Fund": "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
  Liquid: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function MfSnapshot() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [totalReturns, setTotalReturns] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFunds = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch("/api/mutual-funds");
      const data = await res.json();
      setFunds(data.funds || []);
      setTotalReturns(data.totalReturns || 0);
    } catch (error) {
      console.error("Failed to fetch funds:", error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
          <p className="text-xs">Loading mutual funds...</p>
        </CardContent>
      </Card>
    );
  }

  if (funds.length === 0) return null;

  const displayFunds = funds.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-violet-600" />
              Your Mutual Funds
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Funds managed by professionals. NAVs update daily.
              <span className="ml-2">
                Returns:{" "}
                <span
                  className={`font-semibold ${
                    totalReturns >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {totalReturns >= 0 ? "+" : ""}
                  {formatINR(totalReturns)}
                </span>
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchFunds(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayFunds.map((fund) => {
          const categoryColor =
            CATEGORY_COLORS[fund.category || ""] ||
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";

          return (
            <div
              key={fund.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      fund.unrealizedPnl >= 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    }`}
                  >
                    {fund.unrealizedPnl >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm leading-tight truncate max-w-[200px]">
                        {fund.schemeName}
                      </p>
                      {fund.category && (
                        <Badge
                          className={`text-[10px] py-0 ${categoryColor}`}
                        >
                          {fund.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Invested {formatINR(fund.investedAmount)} → Current{" "}
                      {formatINR(fund.currentValue)}
                      {fund.isSip && fund.sipAmount && (
                        <span className="ml-1 inline-flex items-center gap-0.5">
                          <CalendarClock className="h-3 w-3" />
                          SIP: {formatINR(fund.sipAmount)}/mo
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        fund.unrealizedPnl >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {fund.unrealizedPnl >= 0 ? "+" : ""}
                      {formatINR(fund.unrealizedPnl)}
                      <span className="text-xs ml-1">
                        ({fund.unrealizedPnlPct >= 0 ? "+" : ""}
                        {fund.unrealizedPnlPct}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {funds.length > 5 && (
          <Link href="/dashboard/mutual-funds">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View all {funds.length} funds
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
