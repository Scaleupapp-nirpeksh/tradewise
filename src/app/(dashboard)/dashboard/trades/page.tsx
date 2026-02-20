"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { Plus, Filter, LogOut, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TradeInsight } from "@/components/ai-buddy/trade-insight";
import { formatINR } from "@/lib/charges";

interface ChargeData {
  brokerage: number;
  stt: number;
  exchangeCharges: number;
  gst: number;
  sebiCharges: number;
  stampDuty: number;
  totalCharges: number;
}

interface Trade {
  id: string;
  symbol: string;
  exchange: string;
  side: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  targetPrice: number | null;
  stopLossPrice: number | null;
  grossPnl: number | null;
  netPnl: number | null;
  charges: ChargeData | null;
  status: string;
  emotionTag: string | null;
  entryTime: string | null;
  exitTime: string | null;
  createdAt: string;
  strategy: { name: string } | null;
}

const EMOTION_COLORS: Record<string, string> = {
  PLANNED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  CONFIDENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  FOMO: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  REVENGE: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  IMPULSE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  UNCERTAIN: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const EMOTION_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  CONFIDENT: "Confident",
  FOMO: "FOMO",
  REVENGE: "Revenge",
  IMPULSE: "Impulse",
  UNCERTAIN: "Unsure",
};

function formatDuration(entryTime: string | null, exitTime: string | null): string {
  if (!entryTime || !exitTime) return "—";
  const diff = new Date(exitTime).getTime() - new Date(entryTime).getTime();
  if (diff < 0) return "—";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function getAchievedRR(trade: Trade): string | null {
  if (trade.status !== "CLOSED" || !trade.exitPrice || !trade.targetPrice || !trade.stopLossPrice) return null;
  const risk = Math.abs(trade.entryPrice - trade.stopLossPrice);
  if (risk <= 0) return null;
  const achieved = trade.side === "BUY"
    ? (trade.exitPrice - trade.entryPrice) / risk
    : (trade.entryPrice - trade.exitPrice) / risk;
  return achieved.toFixed(1);
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [closingTrade, setClosingTrade] = useState<Trade | null>(null);
  const [exitPrice, setExitPrice] = useState("");
  const [closing, setClosing] = useState(false);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  const fetchTrades = () => {
    const params = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/trades${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTrades(data.trades || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrades();
  }, [filter]);

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
        fetchTrades();
      }
    } catch (error) {
      console.error("Failed to close trade:", error);
    }
    setClosing(false);
  };

  const totalPnl = trades
    .filter((t) => t.status === "CLOSED")
    .reduce((sum, t) => sum + (t.netPnl || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Trades</h1>
          <p className="text-muted-foreground text-sm">
            All your intraday trades in one place. Click any closed trade to see the full breakdown.
          </p>
        </div>
        <Link href="/dashboard/trades/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Trade
          </Button>
        </Link>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {trades.length} trades
          {totalPnl !== 0 && (
            <span
              className={`ml-2 font-semibold ${
                totalPnl >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              Total: {totalPnl >= 0 ? "+" : ""}
              {formatINR(totalPnl)}
            </span>
          )}
        </div>
      </div>

      {/* Trades Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading trades...
            </div>
          ) : trades.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No trades found. Start by adding your first trade!
              </p>
              <Link href="/dashboard/trades/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Trade
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stock</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Entry</TableHead>
                    <TableHead className="text-right">Exit</TableHead>
                    <TableHead className="text-right">Net P&L</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Emotion</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => {
                    const achievedRR = getAchievedRR(trade);
                    return (
                      <Fragment key={trade.id}>
                        <TableRow
                          className={trade.status === "CLOSED" ? "cursor-pointer hover:bg-accent/50" : ""}
                          onClick={() => {
                            if (trade.status === "CLOSED") {
                              setExpandedTrade(expandedTrade === trade.id ? null : trade.id);
                            }
                          }}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{trade.symbol}</p>
                              {trade.strategy && (
                                <p className="text-xs text-muted-foreground">
                                  {trade.strategy.name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                trade.side === "BUY"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                              }
                            >
                              {trade.side}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {trade.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatINR(trade.entryPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {trade.exitPrice
                              ? formatINR(trade.exitPrice)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {trade.netPnl !== null ? (
                              <div>
                                <span
                                  className={`font-semibold ${
                                    trade.netPnl >= 0
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {trade.netPnl >= 0 ? "+" : ""}
                                  {formatINR(trade.netPnl)}
                                </span>
                                {achievedRR && (
                                  <p className="text-xs text-muted-foreground">
                                    R/R {achievedRR}
                                  </p>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDuration(trade.entryTime, trade.exitTime)}
                          </TableCell>
                          <TableCell>
                            {trade.emotionTag ? (
                              <Badge className={EMOTION_COLORS[trade.emotionTag] || ""}>
                                {EMOTION_LABELS[trade.emotionTag] || trade.emotionTag}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                trade.status === "OPEN"
                                  ? "border-amber-300 text-amber-600"
                                  : "border-border text-muted-foreground"
                              }
                            >
                              {trade.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trade.status === "OPEN" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setClosingTrade(trade);
                                  setExitPrice("");
                                }}
                              >
                                <LogOut className="h-3 w-3 mr-1" />
                                Close
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTrade(expandedTrade === trade.id ? null : trade.id);
                                }}
                              >
                                {expandedTrade === trade.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {/* Expanded detail row */}
                        {expandedTrade === trade.id && trade.status === "CLOSED" && (
                          <TableRow key={`${trade.id}-details`}>
                            <TableCell colSpan={10} className="bg-muted/30 p-4">
                              <div className="max-w-lg space-y-4">
                                {/* Holding duration insight */}
                                {trade.entryTime && trade.exitTime && (
                                  <p className="text-sm text-muted-foreground">
                                    You held this trade for <strong>{formatDuration(trade.entryTime, trade.exitTime)}</strong>.
                                  </p>
                                )}

                                {/* Target comparison */}
                                {trade.targetPrice && trade.exitPrice && (
                                  <p className="text-sm text-muted-foreground">
                                    {trade.side === "BUY" ? (
                                      trade.exitPrice >= trade.targetPrice
                                        ? <>You hit your target of {formatINR(trade.targetPrice)} — great discipline!</>
                                        : <>Your target was {formatINR(trade.targetPrice)} but you exited at {formatINR(trade.exitPrice)} — that&apos;s {Math.round(((trade.exitPrice - trade.entryPrice) / (trade.targetPrice - trade.entryPrice)) * 100)}% of your target.</>
                                    ) : (
                                      trade.exitPrice <= trade.targetPrice
                                        ? <>You hit your target of {formatINR(trade.targetPrice)} — great discipline!</>
                                        : <>Your target was {formatINR(trade.targetPrice)} but you exited at {formatINR(trade.exitPrice)}.</>
                                    )}
                                  </p>
                                )}

                                {/* No SL warning */}
                                {!trade.stopLossPrice && (trade.netPnl || 0) < 0 && (
                                  <p className="text-sm text-amber-600 dark:text-amber-400">
                                    No stop-loss was set for this trade. Always set a stop-loss to limit your losses!
                                  </p>
                                )}

                                {/* Charge breakdown */}
                                {trade.charges && (
                                  <>
                                    <p className="text-sm font-medium">Charge Breakdown</p>
                                    <div className="space-y-1.5 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Gross P&L</span>
                                        <span className={`font-medium ${(trade.grossPnl || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                          {(trade.grossPnl || 0) >= 0 ? "+" : ""}{formatINR(trade.grossPnl || 0)}
                                        </span>
                                      </div>
                                      <hr className="my-1 border-border" />
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Brokerage (₹20 x 2 orders)</span>
                                        <span>-{formatINR(trade.charges.brokerage)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">STT (0.025% on sell)</span>
                                        <span>-{formatINR(trade.charges.stt)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Exchange charges</span>
                                        <span>-{formatINR(trade.charges.exchangeCharges)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">GST (18%)</span>
                                        <span>-{formatINR(trade.charges.gst)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">SEBI charges</span>
                                        <span>-{formatINR(trade.charges.sebiCharges)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Stamp duty</span>
                                        <span>-{formatINR(trade.charges.stampDuty)}</span>
                                      </div>
                                      <hr className="my-1 border-border" />
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Charges</span>
                                        <span className="font-medium text-red-600">-{formatINR(trade.charges.totalCharges)}</span>
                                      </div>
                                      <div className="flex justify-between text-base">
                                        <span className="font-medium">Net P&L</span>
                                        <span className={`font-bold ${(trade.netPnl || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                          {(trade.netPnl || 0) >= 0 ? "+" : ""}{formatINR(trade.netPnl || 0)}
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                )}
                                <TradeInsight tradeId={trade.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Side</p>
                  <p className="font-medium">{closingTrade.side} x{closingTrade.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entry Price</p>
                  <p className="font-medium">{formatINR(closingTrade.entryPrice)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitPriceInput">Exit Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                  <Input
                    id="exitPriceInput"
                    type="number"
                    step="0.05"
                    className="pl-7"
                    placeholder="e.g., 1265.00"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the price at which you sold/exited your position.
                </p>
              </div>
              {exitPrice && parseFloat(exitPrice) > 0 && (
                <>
                  <ChargeBreakdown
                    entryPrice={closingTrade.entryPrice}
                    exitPrice={parseFloat(exitPrice)}
                    quantity={closingTrade.quantity}
                    side={closingTrade.side as "BUY" | "SELL"}
                    exchange={closingTrade.exchange}
                  />
                  <CloseTradeTips
                    side={closingTrade.side as "BUY" | "SELL"}
                    entryPrice={closingTrade.entryPrice}
                    exitPrice={parseFloat(exitPrice)}
                    quantity={closingTrade.quantity}
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
    </div>
  );
}
