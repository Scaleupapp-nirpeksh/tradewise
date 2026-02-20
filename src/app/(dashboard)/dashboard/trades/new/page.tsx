"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StockSearch } from "@/components/shared/stock-search";
import { NewTradeTips } from "@/components/ai-buddy/new-trade-tips";
import Link from "next/link";

const EMOTION_OPTIONS = [
  { tag: "PLANNED", label: "Planned carefully", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  { tag: "CONFIDENT", label: "Felt confident", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  { tag: "FOMO", label: "FOMO — jumped in", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
  { tag: "REVENGE", label: "Recovering a loss", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
  { tag: "IMPULSE", label: "Spontaneous", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  { tag: "UNCERTAIN", label: "Wasn't sure", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
];

export default function NewTradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [strategies, setStrategies] = useState<
    { id: string; name: string }[]
  >([]);
  const [form, setForm] = useState(() => ({
    symbol: searchParams.get("symbol") || "",
    exchange: "NSE",
    side: (searchParams.get("side") || "BUY") as "BUY" | "SELL",
    quantity: "",
    entryPrice: searchParams.get("entry") || "",
    exitPrice: "",
    targetPrice: searchParams.get("target") || "",
    stopLossPrice: searchParams.get("sl") || "",
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: "",
    strategyId: "",
    notes: searchParams.get("suggestionId") ? `AI Suggestion: ${searchParams.get("suggestionId")}` : "",
    emotionTag: "",
    setupRating: "",
  }));

  useEffect(() => {
    fetch("/api/strategies")
      .then((r) => r.json())
      .then((data) => setStrategies(data.strategies || []))
      .catch(() => {});
  }, []);

  // Live P&L calculation
  const livePnl = useMemo(() => {
    const qty = parseFloat(form.quantity) || 0;
    const entry = parseFloat(form.entryPrice) || 0;
    const exit = parseFloat(form.exitPrice) || 0;
    if (qty <= 0 || entry <= 0 || exit <= 0) return null;

    const gross =
      form.side === "BUY"
        ? (exit - entry) * qty
        : (entry - exit) * qty;

    // Rough charge estimate (₹40 brokerage + ~0.04% of turnover)
    const turnover = (entry + exit) * qty;
    const estimatedCharges = 40 + turnover * 0.0004;

    return {
      gross: Math.round(gross * 100) / 100,
      net: Math.round((gross - estimatedCharges) * 100) / 100,
      charges: Math.round(estimatedCharges * 100) / 100,
    };
  }, [form.side, form.quantity, form.entryPrice, form.exitPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity),
          entryPrice: parseFloat(form.entryPrice),
          exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
          targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : null,
          stopLossPrice: form.stopLossPrice ? parseFloat(form.stopLossPrice) : null,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/trades");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add trade:", error);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/trades">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Trade</h1>
          <p className="text-muted-foreground text-sm">
            Record a trade like a diary entry — what you traded, at what price, and how it went.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stock & Direction */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What did you trade?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Stock</Label>
                <StockSearch
                  id="symbol"
                  value={form.symbol}
                  onChange={(symbol) => setForm({ ...form, symbol })}
                />
              </div>
              <div className="space-y-2">
                <Label>Exchange</Label>
                <Select
                  value={form.exchange}
                  onValueChange={(v) => setForm({ ...form, exchange: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NSE">NSE</SelectItem>
                    <SelectItem value="BSE">BSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Direction — Did you buy or sell?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, side: "BUY" })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 font-medium transition-colors ${
                    form.side === "BUY"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    BUY (Long)
                  </div>
                  <span className="text-xs font-normal text-muted-foreground">
                    Bought shares, hoping price goes UP
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, side: "SELL" })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 font-medium transition-colors ${
                    form.side === "SELL"
                      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    SELL (Short)
                  </div>
                  <span className="text-xs font-normal text-muted-foreground">
                    Sold first, hoping price goes DOWN
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price & Quantity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="100"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">How many shares?</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entryPrice">Entry Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.05"
                    className="pl-7"
                    placeholder="1250.00"
                    value={form.entryPrice}
                    onChange={(e) =>
                      setForm({ ...form, entryPrice: e.target.value })
                    }
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Price you {form.side === "BUY" ? "bought" : "sold"} at</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitPrice">Exit Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.05"
                    className="pl-7"
                    placeholder="1265.00"
                    value={form.exitPrice}
                    onChange={(e) =>
                      setForm({ ...form, exitPrice: e.target.value })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">Leave empty if still open</p>
              </div>
            </div>

            {/* Live P&L Preview */}
            {livePnl && (
              <div
                className={`rounded-lg p-4 ${
                  livePnl.net >= 0
                    ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900"
                    : "bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-900"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Estimated P&L
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        livePnl.net >= 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {livePnl.net >= 0 ? "+" : ""}₹
                      {livePnl.net.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      Gross: ₹{livePnl.gross.toLocaleString("en-IN")}
                    </p>
                    <p className="text-muted-foreground">
                      Charges: ~₹{livePnl.charges.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Includes estimated brokerage (₹20/order), STT, GST, and other charges.
                </p>
              </div>
            )}

            {/* Target & Stop Loss */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetPrice" className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-emerald-600" />
                  Target Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    id="targetPrice"
                    type="number"
                    step="0.05"
                    className="pl-7"
                    placeholder="1280.00"
                    value={form.targetPrice}
                    onChange={(e) =>
                      setForm({ ...form, targetPrice: e.target.value })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The price you&apos;re hoping to reach. We&apos;ll alert you when it&apos;s close.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stopLossPrice" className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                  Stop Loss
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    id="stopLossPrice"
                    type="number"
                    step="0.05"
                    className="pl-7"
                    placeholder="1230.00"
                    value={form.stopLossPrice}
                    onChange={(e) =>
                      setForm({ ...form, stopLossPrice: e.target.value })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your safety net — exit here to limit your loss.
                </p>
              </div>
            </div>

            {/* Risk/Reward indicator */}
            {form.entryPrice && form.targetPrice && form.stopLossPrice && (
              <div className="rounded-lg p-3 bg-muted/50 border text-sm">
                {(() => {
                  const entry = parseFloat(form.entryPrice);
                  const target = parseFloat(form.targetPrice);
                  const sl = parseFloat(form.stopLossPrice);
                  const qty = parseFloat(form.quantity) || 1;
                  if (!entry || !target || !sl) return null;
                  const reward = Math.abs(target - entry) * qty;
                  const risk = Math.abs(entry - sl) * qty;
                  const ratio = risk > 0 ? reward / risk : 0;
                  return (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Risk/Reward Ratio — is the potential profit worth the risk?
                      </span>
                      <span
                        className={`font-semibold ${
                          ratio >= 2
                            ? "text-emerald-600"
                            : ratio >= 1
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        1:{ratio.toFixed(1)}
                        {ratio >= 2
                          ? " (Good!)"
                          : ratio >= 1
                          ? " (Okay)"
                          : " (Risky)"}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entryTime">Entry Time</Label>
                <Input
                  id="entryTime"
                  type="datetime-local"
                  value={form.entryTime}
                  onChange={(e) =>
                    setForm({ ...form, entryTime: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">When did you enter?</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitTime">Exit Time</Label>
                <Input
                  id="exitTime"
                  type="datetime-local"
                  value={form.exitTime}
                  onChange={(e) =>
                    setForm({ ...form, exitTime: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">When did you close? (skip if open)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Buddy Tips */}
        <NewTradeTips
          symbol={form.symbol}
          side={form.side}
          quantity={form.quantity}
          entryPrice={form.entryPrice}
          targetPrice={form.targetPrice}
          stopLossPrice={form.stopLossPrice}
          emotionTag={form.emotionTag}
        />

        {/* Optional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              How you felt & why you traded{" "}
              <span className="text-muted-foreground font-normal text-sm">
                (optional — helps you spot patterns)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Strategy — which approach did you follow?</Label>
              <Select
                value={form.strategyId}
                onValueChange={(v) =>
                  setForm({ ...form, strategyId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Tracking strategies helps you see what works best over time.
              </p>
            </div>

            <div className="space-y-2">
              <Label>How were you feeling when you took this trade?</Label>
              <div className="flex flex-wrap gap-2">
                {EMOTION_OPTIONS.map((opt) => (
                  <Badge
                    key={opt.tag}
                    variant={form.emotionTag === opt.tag ? "default" : "outline"}
                    className={`cursor-pointer ${
                      form.emotionTag === opt.tag
                        ? opt.color
                        : "hover:bg-accent"
                    }`}
                    onClick={() =>
                      setForm({
                        ...form,
                        emotionTag: form.emotionTag === opt.tag ? "" : opt.tag,
                      })
                    }
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                This helps spot emotional patterns — like losing money on impulsive trades.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Why did you take this trade? What did you see on the chart?"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/dashboard/trades" className="flex-1">
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
          >
            <IndianRupee className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Trade"}
          </Button>
        </div>
      </form>
    </div>
  );
}
