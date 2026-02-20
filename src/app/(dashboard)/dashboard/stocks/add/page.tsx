"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StockSearch } from "@/components/shared/stock-search";

export default function AddHoldingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    symbol: "",
    exchange: "NSE",
    quantity: "",
    buyPrice: "",
    buyDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const qty = parseFloat(form.quantity) || 0;
  const price = parseFloat(form.buyPrice) || 0;
  const investedValue = qty * price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/dashboard/stocks");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add holding");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-blue-600" />
          Add Stock Holding
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Record a stock you own and plan to hold for the long term.
        </p>
      </div>

      {/* Explainer */}
      <div className="rounded-lg p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">What is this?</p>
            <p>
              This is for stocks you bought and plan to hold — not for same-day
              (intraday) trades. We&apos;ll track the live price and show you
              how your investment is doing.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Holding Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Symbol + Exchange */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Stock</Label>
                <StockSearch
                  id="symbol"
                  value={form.symbol}
                  onChange={(v) => setForm({ ...form, symbol: v })}
                  placeholder="Type a stock name like Reliance, TCS..."
                />
                <p className="text-xs text-muted-foreground">
                  Which stock did you buy?
                </p>
              </div>
              <div className="space-y-2">
                <Label>Exchange</Label>
                <div className="flex gap-2">
                  {["NSE", "BSE"].map((ex) => (
                    <Button
                      key={ex}
                      type="button"
                      variant={form.exchange === ex ? "default" : "outline"}
                      className={
                        form.exchange === ex
                          ? "bg-blue-600 hover:bg-blue-700 flex-1"
                          : "flex-1"
                      }
                      onClick={() => setForm({ ...form, exchange: ex })}
                    >
                      {ex}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Where did you buy it? Most stocks are on NSE.
                </p>
              </div>
            </div>

            {/* Quantity + Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="10"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  How many shares do you own?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyPrice">Average Buy Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    id="buyPrice"
                    type="number"
                    step="0.01"
                    className="pl-7"
                    placeholder="500.00"
                    value={form.buyPrice}
                    onChange={(e) =>
                      setForm({ ...form, buyPrice: e.target.value })
                    }
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The price per share you paid. If you bought in multiple
                  batches, enter the average (check your broker app).
                </p>
              </div>
            </div>

            {/* Buy Date */}
            <div className="space-y-2">
              <Label htmlFor="buyDate">Buy Date</Label>
              <Input
                id="buyDate"
                type="date"
                value={form.buyDate}
                onChange={(e) =>
                  setForm({ ...form, buyDate: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                When did you buy these shares?
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Why did you buy this stock? e.g., 'Strong quarterly results, holding for 2+ years'"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Why did you buy this stock? This helps you review your decisions
                later.
              </p>
            </div>

            {/* Live Preview */}
            {investedValue > 0 && (
              <div className="rounded-xl p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900">
                <p className="text-sm text-muted-foreground mb-1">
                  Investment Summary
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                  }).format(investedValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {qty} shares x ₹{price.toFixed(2)} per share
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={
                  submitting ||
                  !form.symbol ||
                  !form.quantity ||
                  !form.buyPrice
                }
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {submitting ? "Adding..." : "Add Holding"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
