"use client";

import { useState, useMemo } from "react";
import { Calculator, PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  // SIP / Lumpsum Calculator
  const [sipMode, setSipMode] = useState<"sip" | "lumpsum">("sip");
  const [sipForm, setSipForm] = useState({
    monthlyAmount: "5000",
    lumpsumAmount: "100000",
    returnRate: "12",
    years: "10",
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

  const sipResult = useMemo(() => {
    const rate = parseFloat(sipForm.returnRate) || 0;
    const years = parseFloat(sipForm.years) || 0;
    if (rate <= 0 || years <= 0) return null;

    if (sipMode === "sip") {
      const monthly = parseFloat(sipForm.monthlyAmount) || 0;
      if (monthly <= 0) return null;

      const monthlyRate = rate / 100 / 12;
      const months = years * 12;
      const totalInvested = monthly * months;
      // FV = P × [((1 + r)^n - 1) / r] × (1 + r)
      const futureValue =
        monthly *
        ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
        (1 + monthlyRate);

      return {
        totalInvested,
        futureValue: Math.round(futureValue),
        wealthGained: Math.round(futureValue - totalInvested),
      };
    } else {
      const lumpsum = parseFloat(sipForm.lumpsumAmount) || 0;
      if (lumpsum <= 0) return null;

      const futureValue = lumpsum * Math.pow(1 + rate / 100, years);

      return {
        totalInvested: lumpsum,
        futureValue: Math.round(futureValue),
        wealthGained: Math.round(futureValue - lumpsum),
      };
    }
  }, [sipForm, sipMode]);

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
          Calculators
        </h1>
        <p className="text-muted-foreground text-sm">
          Tools to help you make smart decisions — position sizing, risk/reward analysis, and investment growth projections.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* SIP / Lumpsum Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-violet-600" />
            How Much Will My Investment Grow?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            See how your money can grow over time with the power of compounding.
            Compounding means your returns earn returns — like a snowball effect!
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              variant={sipMode === "sip" ? "default" : "outline"}
              size="sm"
              onClick={() => setSipMode("sip")}
              className={sipMode === "sip" ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              Monthly SIP
            </Button>
            <Button
              variant={sipMode === "lumpsum" ? "default" : "outline"}
              size="sm"
              onClick={() => setSipMode("lumpsum")}
              className={sipMode === "lumpsum" ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              One-time Investment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sipMode === "sip" ? (
              <div className="space-y-2">
                <Label>Monthly Investment</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    type="number"
                    className="pl-7"
                    value={sipForm.monthlyAmount}
                    onChange={(e) =>
                      setSipForm({ ...sipForm, monthlyAmount: e.target.value })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  How much will you invest every month?
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Investment Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    type="number"
                    className="pl-7"
                    value={sipForm.lumpsumAmount}
                    onChange={(e) =>
                      setSipForm({ ...sipForm, lumpsumAmount: e.target.value })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  How much are you investing at once?
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Expected Return</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  value={sipForm.returnRate}
                  onChange={(e) =>
                    setSipForm({ ...sipForm, returnRate: e.target.value })
                  }
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                  % / year
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Equity funds average 12-15%. Debt funds average 7-8%.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Time Period</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="1"
                  value={sipForm.years}
                  onChange={(e) =>
                    setSipForm({ ...sipForm, years: e.target.value })
                  }
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                  years
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Longer = more compounding. 5+ years is ideal.
              </p>
            </div>
          </div>

          {sipResult && (
            <div className="rounded-xl p-5 bg-violet-50 border border-violet-200 dark:bg-violet-950/50 dark:border-violet-900 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">You Invest</p>
                  <p className="text-xl font-bold">
                    {formatINR(sipResult.totalInvested)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">It Grows To</p>
                  <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">
                    {formatINR(sipResult.futureValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Wealth Gained
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    +{formatINR(sipResult.wealthGained)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Free money from compounding!
                  </p>
                </div>
              </div>

              {/* Visual bar */}
              <div className="flex h-10 rounded-xl overflow-hidden border border-violet-200 dark:border-violet-800">
                <div
                  className="bg-blue-400 dark:bg-blue-600 flex items-center justify-center text-sm text-white font-medium"
                  style={{
                    width: `${(sipResult.totalInvested / sipResult.futureValue) * 100}%`,
                    minWidth: "80px",
                  }}
                >
                  You invest
                </div>
                <div
                  className="bg-emerald-400 dark:bg-emerald-600 flex items-center justify-center text-sm text-white font-medium"
                  style={{
                    width: `${(sipResult.wealthGained / sipResult.futureValue) * 100}%`,
                    minWidth: "80px",
                  }}
                >
                  Market gives
                </div>
              </div>
            </div>
          )}

          {!sipResult && (
            <div className="rounded-lg p-4 bg-muted/50 border">
              <p className="text-sm font-medium mb-2">Example</p>
              <p className="text-sm text-muted-foreground">
                {sipMode === "sip"
                  ? "If you invest ₹5,000/month at 12% for 10 years: You invest ₹6,00,000 total, but it grows to about ₹11,61,695. The extra ₹5,61,695 is the power of compounding!"
                  : "If you invest ₹1,00,000 at 12% for 10 years: Your money grows to about ₹3,10,585. You more than triple your investment!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
