"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Briefcase,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Brain,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/charges";

interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  investedValue: number;
  currentValue: number;
}

interface HoldingAdvice {
  action: string;
  reasoning: string;
  confidence: string;
}

const ACTION_STYLES: Record<string, string> = {
  HOLD: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  SELL: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  ADD_MORE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

const ACTION_LABELS: Record<string, string> = {
  HOLD: "Hold",
  SELL: "Sell",
  ADD_MORE: "Add More",
};

export function LiveHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalPnl, setTotalPnl] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advice, setAdvice] = useState<Record<string, HoldingAdvice>>({});
  const [adviceLoading, setAdviceLoading] = useState<Record<string, boolean>>({});

  const fetchHoldings = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch("/api/holdings");
      const data = await res.json();
      setHoldings(data.holdings || []);
      setTotalPnl(data.totalPnl || 0);
    } catch (error) {
      console.error("Failed to fetch holdings:", error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchHoldings();
    const interval = setInterval(() => fetchHoldings(), 60000);
    return () => clearInterval(interval);
  }, [fetchHoldings]);

  const getAdvice = async (holdingId: string) => {
    setAdviceLoading((prev) => ({ ...prev, [holdingId]: true }));
    try {
      const res = await fetch("/api/ai/holding-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdingId }),
      });
      const data = await res.json();
      setAdvice((prev) => ({
        ...prev,
        [holdingId]: {
          action: data.action,
          reasoning: data.reasoning,
          confidence: data.confidence,
        },
      }));
    } catch (error) {
      console.error("Failed to get advice:", error);
    }
    setAdviceLoading((prev) => ({ ...prev, [holdingId]: false }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
          <p className="text-xs">Loading holdings...</p>
        </CardContent>
      </Card>
    );
  }

  if (holdings.length === 0) return null;

  const displayHoldings = holdings.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              Your Stock Holdings
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Stocks you own for the long term. Prices update automatically.
              <span className="ml-2">
                Total:{" "}
                <span
                  className={`font-semibold ${
                    totalPnl >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {totalPnl >= 0 ? "+" : ""}
                  {formatINR(totalPnl)}
                </span>
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchHoldings(true)}
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
        {displayHoldings.map((h) => {
          const holdingAdvice = advice[h.id];
          const isAdviceLoading = adviceLoading[h.id];

          return (
            <div
              key={h.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      h.unrealizedPnl >= 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    }`}
                  >
                    {h.unrealizedPnl >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{h.symbol}</p>
                      <Badge variant="outline" className="text-xs py-0">
                        {h.quantity} qty
                      </Badge>
                      {holdingAdvice && (
                        <Badge
                          className={`text-xs py-0 ${
                            ACTION_STYLES[holdingAdvice.action] || ""
                          }`}
                        >
                          {ACTION_LABELS[holdingAdvice.action] ||
                            holdingAdvice.action}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {formatINR(h.buyPrice)} → Now: {formatINR(h.currentPrice)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        h.unrealizedPnl >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {h.unrealizedPnl >= 0 ? "+" : ""}
                      {formatINR(h.unrealizedPnl)}
                      <span className="text-xs ml-1">
                        ({h.unrealizedPnlPct >= 0 ? "+" : ""}
                        {h.unrealizedPnlPct}%)
                      </span>
                    </p>
                  </div>
                  {!holdingAdvice && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => getAdvice(h.id)}
                      disabled={isAdviceLoading}
                      title="Get AI advice"
                    >
                      {isAdviceLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4 text-violet-500" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {holdingAdvice && (
                <div className="mt-2 sm:ml-11 p-2 rounded bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900 text-xs text-violet-800 dark:text-violet-300">
                  <span className="font-medium">AI: </span>
                  {holdingAdvice.reasoning}
                </div>
              )}
            </div>
          );
        })}

        {holdings.length > 5 && (
          <Link href="/dashboard/stocks">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View all {holdings.length} holdings
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
