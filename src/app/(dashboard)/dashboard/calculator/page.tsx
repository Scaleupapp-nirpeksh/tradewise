"use client";

import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalculatorPage() {
  // Position Size Calculator
  const [posForm, setPosForm] = useState({
    capital: "100000",
    riskPct: "2",
    entryPrice: "",
    stopLossPrice: "",
  });

  // Risk/Reward Calculator
  const [rrForm, setRrForm] = useState({
    entryPrice: "",
    targetPrice: "",
    stopLossPrice: "",
    quantity: "",
  });

  const posResult = useMemo(() => {
    const capital = parseFloat(posForm.capital) || 0;
    const riskPct = parseFloat(posForm.riskPct) || 0;
    const entry = parseFloat(posForm.entryPrice) || 0;
    const sl = parseFloat(posForm.stopLossPrice) || 0;
    if (capital <= 0 || entry <= 0 || sl <= 0 || riskPct <= 0) return null;

    const maxRisk = capital * (riskPct / 100);
    const riskPerShare = Math.abs(entry - sl);
    if (riskPerShare <= 0) return null;

    const qty = Math.floor(maxRisk / riskPerShare);
    const capitalNeeded = qty * entry;

    return {
      quantity: qty,
      capitalNeeded,
      maxLoss: qty * riskPerShare,
      capitalPct: ((capitalNeeded / capital) * 100).toFixed(1),
      maxRisk,
      riskPerShare,
    };
  }, [posForm]);

  const rrResult = useMemo(() => {
    const entry = parseFloat(rrForm.entryPrice) || 0;
    const target = parseFloat(rrForm.targetPrice) || 0;
    const sl = parseFloat(rrForm.stopLossPrice) || 0;
    const qty = parseFloat(rrForm.quantity) || 1;
    if (entry <= 0 || target <= 0 || sl <= 0) return null;

    const risk = Math.abs(entry - sl);
    const reward = Math.abs(target - entry);
    const ratio = risk > 0 ? reward / risk : 0;

    return {
      ratio,
      maxLoss: risk * qty,
      potentialProfit: reward * qty,
      riskPerShare: risk,
      rewardPerShare: reward,
    };
  }, [rrForm]);

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-blue-600" />
          Risk Calculator
        </h1>
        <p className="text-muted-foreground text-sm">
          Figure out how many shares to buy and how much you could make or lose — before you enter a trade.
        </p>
      </div>

      {/* Position Size Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Many Shares Should I Buy?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your capital, how much you&apos;re willing to risk, and the stock prices.
            We&apos;ll tell you the safe number of shares to buy.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Your Total Capital</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  type="number"
                  className="pl-7"
                  value={posForm.capital}
                  onChange={(e) =>
                    setPosForm({ ...posForm, capital: e.target.value })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">How much money do you have for trading?</p>
            </div>
            <div className="space-y-2">
              <Label>Risk Per Trade</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  value={posForm.riskPct}
                  onChange={(e) =>
                    setPosForm({ ...posForm, riskPct: e.target.value })
                  }
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Most pros risk 1-2% per trade. Higher = more risk.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.05"
                  className="pl-7"
                  placeholder="500.00"
                  value={posForm.entryPrice}
                  onChange={(e) =>
                    setPosForm({ ...posForm, entryPrice: e.target.value })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">The price you plan to buy at</p>
            </div>
            <div className="space-y-2">
              <Label>Stop Loss Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.05"
                  className="pl-7"
                  placeholder="490.00"
                  value={posForm.stopLossPrice}
                  onChange={(e) =>
                    setPosForm({ ...posForm, stopLossPrice: e.target.value })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">The price where you&apos;ll exit to limit loss</p>
            </div>
          </div>

          {posResult && (
            <div className="rounded-xl p-5 bg-blue-50 border border-blue-200 dark:bg-blue-950/50 dark:border-blue-900 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    You should buy
                  </p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    {posResult.quantity} shares
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll need
                  </p>
                  <p className="text-2xl font-semibold">
                    {formatINR(posResult.capitalNeeded)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {posResult.capitalPct}% of your capital
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-sm">
                  <span className="text-muted-foreground">If the stock hits your stop loss, you lose: </span>
                  <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                    {formatINR(posResult.maxLoss)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Worked example */}
          {!posResult && (
            <div className="rounded-lg p-4 bg-muted/50 border">
              <p className="text-sm font-medium mb-2">Example</p>
              <p className="text-sm text-muted-foreground">
                If your capital is ₹1,00,000 and you risk 2%, your max loss per trade is ₹2,000.
                If the stock is at ₹500 and your stop-loss is at ₹490 (₹10 risk per share),
                you should buy <strong>200 shares</strong> (₹2,000 ÷ ₹10 = 200).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk/Reward Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Will This Trade Be Worth It?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Check if the potential profit is worth the risk. A good trade should have at least
            2x more potential profit than risk.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.05"
                  className="pl-7"
                  placeholder="500.00"
                  value={rrForm.entryPrice}
                  onChange={(e) =>
                    setRrForm({ ...rrForm, entryPrice: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>How many shares?</Label>
              <Input
                type="number"
                placeholder="100"
                value={rrForm.quantity}
                onChange={(e) =>
                  setRrForm({ ...rrForm, quantity: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.05"
                  className="pl-7"
                  placeholder="520.00"
                  value={rrForm.targetPrice}
                  onChange={(e) =>
                    setRrForm({ ...rrForm, targetPrice: e.target.value })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">The price you hope it reaches</p>
            </div>
            <div className="space-y-2">
              <Label>Stop Loss Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.05"
                  className="pl-7"
                  placeholder="490.00"
                  value={rrForm.stopLossPrice}
                  onChange={(e) =>
                    setRrForm({ ...rrForm, stopLossPrice: e.target.value })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">The price where you&apos;ll cut your loss</p>
            </div>
          </div>

          {rrResult && (
            <div className="rounded-xl p-5 border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Risk/Reward Ratio
                </span>
                <span
                  className={`text-2xl font-bold ${
                    rrResult.ratio >= 2
                      ? "text-emerald-600"
                      : rrResult.ratio >= 1
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  1:{rrResult.ratio.toFixed(1)}
                  {rrResult.ratio >= 2
                    ? " — Great trade!"
                    : rrResult.ratio >= 1
                    ? " — Decent"
                    : " — Too risky"}
                </span>
              </div>

              {/* Visual bar */}
              <div className="flex h-10 rounded-xl overflow-hidden border">
                <div
                  className="bg-red-400 dark:bg-red-600 flex items-center justify-center text-sm text-white font-medium"
                  style={{
                    width: `${(1 / (1 + rrResult.ratio)) * 100}%`,
                    minWidth: "60px",
                  }}
                >
                  Risk
                </div>
                <div
                  className="bg-emerald-400 dark:bg-emerald-600 flex items-center justify-center text-sm text-white font-medium"
                  style={{
                    width: `${(rrResult.ratio / (1 + rrResult.ratio)) * 100}%`,
                    minWidth: "60px",
                  }}
                >
                  Reward
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-center">
                  <p className="text-sm text-muted-foreground">If price hits stop-loss</p>
                  <p className="font-bold text-red-600 dark:text-red-400 text-xl">
                    You lose {formatINR(rrResult.maxLoss)}
                  </p>
                </div>
                <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-center">
                  <p className="text-sm text-muted-foreground">If price hits target</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xl">
                    You make {formatINR(rrResult.potentialProfit)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Worked example */}
          {!rrResult && (
            <div className="rounded-lg p-4 bg-muted/50 border">
              <p className="text-sm font-medium mb-2">Example</p>
              <p className="text-sm text-muted-foreground">
                If you buy at ₹500, set target at ₹520 and stop-loss at ₹490 —
                you risk ₹10/share to make ₹20/share. That&apos;s a 1:2 ratio (good!).
                Even if you win only half your trades, you&apos;ll still make money overall.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
