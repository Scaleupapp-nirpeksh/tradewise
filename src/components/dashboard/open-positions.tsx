"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Brain,
  Loader2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChargeBreakdown } from "@/components/shared/charge-breakdown";
import { CloseTradeTips } from "@/components/ai-buddy/close-trade-tips";
import { PositionTips } from "@/components/ai-buddy/position-tips";
import { OpenPositionWithLive, PositionAdviceData } from "@/types";

const ACTION_STYLES: Record<string, string> = {
  HOLD: "bg-blue-100 text-blue-700 border-blue-200",
  SELL: "bg-red-100 text-red-700 border-red-200",
  BUY_MORE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const ACTION_LABELS: Record<string, string> = {
  HOLD: "Hold",
  SELL: "Sell",
  BUY_MORE: "Buy More",
};

export function OpenPositions() {
  const [positions, setPositions] = useState<OpenPositionWithLive[]>([]);
  const [totalPnl, setTotalPnl] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [advice, setAdvice] = useState<Record<string, PositionAdviceData>>({});
  const [adviceLoading, setAdviceLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [bulkAdviceLoading, setBulkAdviceLoading] = useState(false);
  const [closingTrade, setClosingTrade] = useState<OpenPositionWithLive | null>(null);
  const [exitPrice, setExitPrice] = useState("");
  const [closing, setClosing] = useState(false);

  const handleCloseTrade = async () => {
    if (!closingTrade || !exitPrice) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/trades/${closingTrade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitPrice: parseFloat(exitPrice) }),
      });
      if (res.ok) {
        setClosingTrade(null);
        setExitPrice("");
        fetchPositions(true);
      }
    } catch (error) {
      console.error("Failed to close trade:", error);
    }
    setClosing(false);
  };

  const fetchPositions = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch("/api/positions");
      const data = await res.json();
      setPositions(data.positions || []);
      setTotalPnl(data.totalUnrealizedPnl || 0);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch positions:", error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(() => fetchPositions(), 30000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  const getAdvice = async (tradeId: string) => {
    setAdviceLoading((prev) => ({ ...prev, [tradeId]: true }));
    try {
      const res = await fetch("/api/ai/position-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId }),
      });
      const data = await res.json();
      setAdvice((prev) => ({ ...prev, [tradeId]: data }));
    } catch (error) {
      console.error("Failed to get advice:", error);
    }
    setAdviceLoading((prev) => ({ ...prev, [tradeId]: false }));
  };

  const getBulkAdvice = async () => {
    setBulkAdviceLoading(true);
    try {
      const res = await fetch("/api/ai/position-advice/bulk", {
        method: "POST",
      });
      const data = await res.json();
      const newAdvice: Record<string, PositionAdviceData> = {};
      for (const a of data.advice || []) {
        newAdvice[a.tradeId] = a;
      }
      setAdvice((prev) => ({ ...prev, ...newAdvice }));
    } catch (error) {
      console.error("Failed to get bulk advice:", error);
    }
    setBulkAdviceLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading positions...
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) return null;

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);

  const secondsAgo = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Open Positions</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Total unrealized:{" "}
              <span
                className={`font-semibold ${
                  totalPnl >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {totalPnl >= 0 ? "+" : ""}
                {formatINR(totalPnl)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={getBulkAdvice}
              disabled={bulkAdviceLoading}
            >
              {bulkAdviceLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Brain className="h-3 w-3 mr-1" />
              )}
              AI Advice All
            </Button>
            <span className="text-xs text-muted-foreground">
              {secondsAgo < 5 ? "Just now" : `${secondsAgo}s ago`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchPositions(true)}
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
        {positions.map((pos) => {
          const posAdvice = advice[pos.id];
          const isAdviceLoading = adviceLoading[pos.id];

          return (
            <div
              key={pos.id}
              className="p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Left: Symbol + details */}
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      pos.side === "BUY"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {pos.side === "BUY" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{pos.symbol}</p>
                      <Badge variant="outline" className="text-xs py-0">
                        {pos.side} x{pos.quantity}
                      </Badge>
                      {posAdvice && (
                        <Badge
                          className={`text-xs py-0 ${
                            ACTION_STYLES[posAdvice.action] || ""
                          }`}
                        >
                          {ACTION_LABELS[posAdvice.action] || posAdvice.action}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Entry: {formatINR(pos.entryPrice)}
                      {pos.strategyName && ` · ${pos.strategyName}`}
                    </p>
                  </div>
                </div>

                {/* Center: Target/SL indicators */}
                <div className="hidden md:flex items-center gap-4 text-xs">
                  {pos.targetPrice && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Target className="h-3 w-3" />
                      <span>Target: {formatINR(pos.targetPrice)}</span>
                      {pos.distanceToTarget !== null && (
                        <span className="text-muted-foreground">
                          ({pos.distanceToTarget > 0 ? "+" : ""}
                          {pos.distanceToTarget}%)
                        </span>
                      )}
                    </div>
                  )}
                  {pos.stopLossPrice && (
                    <div className="flex items-center gap-1 text-red-600">
                      <ShieldAlert className="h-3 w-3" />
                      <span>SL: {formatINR(pos.stopLossPrice)}</span>
                      {pos.distanceToStopLoss !== null && (
                        <span className="text-muted-foreground">
                          ({pos.distanceToStopLoss > 0 ? "+" : ""}
                          {pos.distanceToStopLoss}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Price + P&L + AI button */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatINR(pos.currentPrice)}
                    </p>
                    <p
                      className={`font-semibold ${
                        pos.unrealizedPnl >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {pos.unrealizedPnl >= 0 ? "+" : ""}
                      {formatINR(pos.unrealizedPnl)}
                      <span className="text-xs ml-1">
                        ({pos.unrealizedPnlPct >= 0 ? "+" : ""}
                        {pos.unrealizedPnlPct}%)
                      </span>
                    </p>
                  </div>
                  {!posAdvice && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => getAdvice(pos.id)}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setClosingTrade(pos);
                      setExitPrice(pos.currentPrice.toString());
                    }}
                    title="Close this trade"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Close
                  </Button>
                </div>
              </div>

              {/* AI Advice reasoning */}
              {posAdvice && (
                <div className="mt-2 ml-11 p-2 rounded bg-violet-50 border border-violet-100 text-xs text-violet-800">
                  <span className="font-medium">AI: </span>
                  {posAdvice.reasoning}
                </div>
              )}

              {/* AI Buddy position tips */}
              <div className="mt-2 ml-11">
                <PositionTips
                  unrealizedPnlPct={pos.unrealizedPnlPct}
                  stopLossPrice={pos.stopLossPrice}
                  targetPrice={pos.targetPrice}
                  distanceToTarget={pos.distanceToTarget}
                  distanceToStopLoss={pos.distanceToStopLoss}
                  entryTime={pos.entryTime}
                />
              </div>
            </div>
          );
        })}
      </CardContent>

      {/* Close Trade Dialog */}
      <Dialog open={!!closingTrade} onOpenChange={(open) => { if (!open) { setClosingTrade(null); setExitPrice(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close Trade — {closingTrade?.symbol}</DialogTitle>
            <DialogDescription>
              Enter the exit price to close this position. P&L will be calculated automatically.
            </DialogDescription>
          </DialogHeader>
          {closingTrade && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Side</p>
                  <p className="font-medium">{closingTrade.side} x{closingTrade.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entry Price</p>
                  <p className="font-medium">{formatINR(closingTrade.entryPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Price</p>
                  <p className="font-medium">{formatINR(closingTrade.currentPrice)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitPrice">Exit Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.05"
                    className="pl-7"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Pre-filled with the current market price. Change if your actual exit was different.
                </p>
              </div>
              {exitPrice && parseFloat(exitPrice) > 0 && (
                <>
                  <ChargeBreakdown
                    entryPrice={closingTrade.entryPrice}
                    exitPrice={parseFloat(exitPrice)}
                    quantity={closingTrade.quantity}
                    side={closingTrade.side}
                  />
                  <CloseTradeTips
                    side={closingTrade.side}
                    entryPrice={closingTrade.entryPrice}
                    exitPrice={parseFloat(exitPrice)}
                    quantity={closingTrade.quantity}
                    stopLossPrice={closingTrade.stopLossPrice}
                    entryTime={closingTrade.entryTime}
                  />
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setClosingTrade(null); setExitPrice(""); }}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCloseTrade}
              disabled={closing || !exitPrice || parseFloat(exitPrice) <= 0}
            >
              {closing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {closing ? "Closing..." : "Close Trade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
