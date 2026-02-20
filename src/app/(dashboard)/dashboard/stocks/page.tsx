"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockHoldingWithLive } from "@/types";
import { SellHoldingDialog } from "@/components/shared/sell-holding-dialog";
import { HoldingTips } from "@/components/ai-buddy/holding-tips";

interface HoldingAdvice {
  action: string;
  reasoning: string;
  confidence: string;
}

const ADVICE_STYLES: Record<string, string> = {
  HOLD: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  SELL: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  ADD_MORE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

const ADVICE_LABELS: Record<string, string> = {
  HOLD: "Hold",
  SELL: "Sell",
  ADD_MORE: "Add More",
};

export default function StocksPage() {
  const [holdings, setHoldings] = useState<StockHoldingWithLive[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalCurrentValue, setTotalCurrentValue] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sellingHolding, setSellingHolding] =
    useState<StockHoldingWithLive | null>(null);
  const [advice, setAdvice] = useState<Record<string, HoldingAdvice>>({});
  const [adviceLoading, setAdviceLoading] = useState<Record<string, boolean>>({});
  const [bulkAdviceLoading, setBulkAdviceLoading] = useState(false);

  const fetchHoldings = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch("/api/holdings");
      const data = await res.json();
      setHoldings(data.holdings || []);
      setTotalInvested(data.totalInvested || 0);
      setTotalCurrentValue(data.totalCurrentValue || 0);
      setTotalPnl(data.totalPnl || 0);
    } catch (error) {
      console.error("Failed to fetch holdings:", error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchHoldings();
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

  const getBulkAdvice = async () => {
    setBulkAdviceLoading(true);
    try {
      const res = await fetch("/api/ai/holding-advice/bulk", {
        method: "POST",
      });
      const data = await res.json();
      const newAdvice: Record<string, HoldingAdvice> = {};
      for (const a of data.advice || []) {
        newAdvice[a.holdingId] = {
          action: a.action,
          reasoning: a.reasoning,
          confidence: a.confidence,
        };
      }
      setAdvice((prev) => ({ ...prev, ...newAdvice }));
    } catch (error) {
      console.error("Failed to get bulk advice:", error);
    }
    setBulkAdviceLoading(false);
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            My Stock Holdings
          </h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading your holdings...
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPnlPct =
    totalInvested > 0
      ? Math.round((totalPnl / totalInvested) * 10000) / 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            My Stock Holdings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stocks you own for the long term. Unlike intraday trades, you hold
            these for days, weeks, or even years.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {holdings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={getBulkAdvice}
              disabled={bulkAdviceLoading}
              className="text-xs"
            >
              {bulkAdviceLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Brain className="h-3.5 w-3.5 mr-1" />
              )}
              AI Advice All
            </Button>
          )}
          <Link href="/dashboard/stocks/add">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Holding
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => fetchHoldings(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {holdings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No stock holdings yet</p>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start by adding a stock you own, or sync your holdings from Groww.
              Stock holdings are for stocks you bought and plan to hold — not
              same-day trades.
            </p>
            <Link href="/dashboard/stocks/add">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Holding
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {holdings.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Invested</p>
                <p className="text-xl font-bold">{formatINR(totalInvested)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Current Value</p>
                <p className="text-xl font-bold">
                  {formatINR(totalCurrentValue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total P&L</p>
                <p
                  className={`text-xl font-bold ${totalPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {totalPnl >= 0 ? "+" : ""}
                  {formatINR(totalPnl)}
                  <span className="text-sm ml-1">
                    ({totalPnlPct >= 0 ? "+" : ""}
                    {totalPnlPct}%)
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Holdings</p>
                <p className="text-xl font-bold">{holdings.length} stocks</p>
              </CardContent>
            </Card>
          </div>

          {/* Holdings List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Holdings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {holdings.map((h) => {
                const isExpanded = expandedId === h.id;
                return (
                  <div
                    key={h.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : h.id)
                      }
                    >
                      {/* Left: Symbol + details */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            h.unrealizedPnl >= 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
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
                            <Badge
                              variant="outline"
                              className="text-xs py-0"
                            >
                              {h.quantity} shares
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Avg: {formatINR(h.buyPrice)} · Invested:{" "}
                            {formatINR(h.investedValue)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Price + P&L */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {formatINR(h.currentPrice)}
                          </p>
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
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Buy Date
                            </p>
                            <p className="font-medium">
                              {new Date(h.buyDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Current Value
                            </p>
                            <p className="font-medium">
                              {formatINR(h.currentValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Exchange
                            </p>
                            <p className="font-medium">{h.exchange}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Holding Period
                            </p>
                            <p className="font-medium">
                              {(() => {
                                const days = Math.floor(
                                  (Date.now() -
                                    new Date(h.buyDate).getTime()) /
                                    86400000
                                );
                                if (days > 365)
                                  return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
                                if (days > 30)
                                  return `${Math.floor(days / 30)} months`;
                                return `${days} days`;
                              })()}
                            </p>
                          </div>
                        </div>
                        {h.notes && (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                            {h.notes}
                          </p>
                        )}
                        <HoldingTips
                          unrealizedPnlPct={h.unrealizedPnlPct}
                          buyDate={h.buyDate}
                          investedValue={h.investedValue}
                          totalPortfolioValue={totalCurrentValue}
                        />
                          {/* AI Advice */}
                        {advice[h.id] && (
                          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900">
                            <div className="flex items-center gap-2 mb-1">
                              <Brain className="h-3.5 w-3.5 text-violet-600" />
                              <span className="text-xs font-medium text-violet-700 dark:text-violet-400">
                                AI Recommendation
                              </span>
                              <Badge
                                className={`text-xs py-0 ${
                                  ADVICE_STYLES[advice[h.id].action] || ""
                                }`}
                              >
                                {ADVICE_LABELS[advice[h.id].action] ||
                                  advice[h.id].action}
                              </Badge>
                            </div>
                            <p className="text-sm text-violet-900 dark:text-violet-200">
                              {advice[h.id].reasoning}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!advice[h.id] && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                getAdvice(h.id);
                              }}
                              disabled={adviceLoading[h.id]}
                            >
                              {adviceLoading[h.id] ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Brain className="h-3 w-3 mr-1" />
                              )}
                              AI Advice
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSellingHolding(h);
                            }}
                          >
                            Sell
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}

      {/* Sell Dialog */}
      {sellingHolding && (
        <SellHoldingDialog
          holding={sellingHolding}
          open={!!sellingHolding}
          onOpenChange={(open) => {
            if (!open) setSellingHolding(null);
          }}
          onSold={() => {
            setSellingHolding(null);
            fetchHoldings(true);
          }}
        />
      )}
    </div>
  );
}
