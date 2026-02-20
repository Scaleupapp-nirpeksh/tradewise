"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PiggyBank, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MfSearch } from "@/components/shared/mf-search";

const CATEGORIES = [
  "Equity",
  "Debt",
  "Hybrid",
  "ELSS (Tax Saver)",
  "Index Fund",
  "Liquid",
];

export default function AddMutualFundPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentNav, setCurrentNav] = useState<number | null>(null);
  const [loadingNav, setLoadingNav] = useState(false);

  const [form, setForm] = useState({
    schemeName: "",
    schemeCode: "",
    folioNumber: "",
    units: "",
    investedAmount: "",
    category: "",
    isSip: false,
    sipAmount: "",
    sipDate: "",
    notes: "",
  });

  const units = parseFloat(form.units) || 0;
  const invested = parseFloat(form.investedAmount) || 0;
  const currentValue = currentNav ? units * currentNav : 0;
  const returns = currentValue > 0 ? currentValue - invested : 0;
  const returnsPct =
    invested > 0 ? Math.round((returns / invested) * 10000) / 100 : 0;

  // Fetch NAV when scheme is selected
  useEffect(() => {
    if (!form.schemeCode) {
      setCurrentNav(null);
      return;
    }
    setLoadingNav(true);
    fetch(`/api/mf/nav/${form.schemeCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.nav) setCurrentNav(data.nav);
      })
      .catch(() => {})
      .finally(() => setLoadingNav(false));
  }, [form.schemeCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/mutual-funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/dashboard/mutual-funds");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add fund");
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
          <PiggyBank className="h-6 w-6 text-violet-600" />
          Add Mutual Fund
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Record a mutual fund you&apos;ve invested in.
        </p>
      </div>

      {/* Explainer */}
      <div className="rounded-lg p-4 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-900">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
          <div className="text-sm text-violet-800 dark:text-violet-300">
            <p className="font-medium mb-1">What is a mutual fund?</p>
            <p>
              Mutual funds let professionals manage your money — you buy
              &quot;units&quot; and the fund&apos;s value (NAV) changes daily.
              We&apos;ll track how your investment is doing.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fund Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fund Search */}
            <div className="space-y-2">
              <Label htmlFor="fundName">Fund Name</Label>
              <MfSearch
                id="fundName"
                value={form.schemeName}
                onChange={({ schemeName, schemeCode }) =>
                  setForm({ ...form, schemeName, schemeCode })
                }
              />
              <p className="text-xs text-muted-foreground">
                Search for your mutual fund by name (e.g., &quot;Axis
                Bluechip&quot;, &quot;SBI Small Cap&quot;)
              </p>
            </div>

            {/* Category + Folio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  What type of fund is this?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="folio">
                  Folio Number{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="folio"
                  placeholder="e.g., 1234567890"
                  value={form.folioNumber}
                  onChange={(e) =>
                    setForm({ ...form, folioNumber: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Found in your fund statement or broker app.
                </p>
              </div>
            </div>

            {/* Units + Invested */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <Input
                  id="units"
                  type="number"
                  step="0.001"
                  placeholder="100.000"
                  value={form.units}
                  onChange={(e) =>
                    setForm({ ...form, units: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  How many units do you own? Check your broker app or fund
                  statement.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invested">Invested Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    id="invested"
                    type="number"
                    step="0.01"
                    className="pl-7"
                    placeholder="10000"
                    value={form.investedAmount}
                    onChange={(e) =>
                      setForm({ ...form, investedAmount: e.target.value })
                    }
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total money you&apos;ve put into this fund (in ₹).
                </p>
              </div>
            </div>

            {/* SIP Toggle */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label htmlFor="isSip" className="cursor-pointer">
                  Is this a SIP?
                </Label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isSip}
                  onClick={() =>
                    setForm({ ...form, isSip: !form.isSip })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isSip
                      ? "bg-violet-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.isSip ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Do you invest a fixed amount every month automatically?
                That&apos;s called a SIP (Systematic Investment Plan).
              </p>

              {form.isSip && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sipAmount">SIP Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                        ₹
                      </span>
                      <Input
                        id="sipAmount"
                        type="number"
                        className="pl-7"
                        placeholder="5000"
                        value={form.sipAmount}
                        onChange={(e) =>
                          setForm({ ...form, sipAmount: e.target.value })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      How much do you invest each month?
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sipDate">SIP Date</Label>
                    <Input
                      id="sipDate"
                      type="number"
                      min="1"
                      max="28"
                      placeholder="15"
                      value={form.sipDate}
                      onChange={(e) =>
                        setForm({ ...form, sipDate: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Which day of the month? (1-28)
                    </p>
                  </div>
                </div>
              )}
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
                placeholder="Why did you choose this fund? e.g., 'Low expense ratio, consistent 5-year returns'"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            {/* Live Preview */}
            {form.schemeCode && (
              <div className="rounded-xl p-4 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-900 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Current NAV</p>
                  {loadingNav ? (
                    <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                  ) : currentNav ? (
                    <p className="font-semibold text-violet-700 dark:text-violet-400">
                      ₹{currentNav.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Unable to fetch
                    </p>
                  )}
                </div>
                {currentNav && units > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Current Value
                      </p>
                      <p className="font-semibold">
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                        }).format(currentValue)}
                      </p>
                    </div>
                    {invested > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Returns
                        </p>
                        <p
                          className={`font-semibold ${returns >= 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {returns >= 0 ? "+" : ""}
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(returns)}{" "}
                          ({returnsPct >= 0 ? "+" : ""}
                          {returnsPct}%)
                        </p>
                      </div>
                    )}
                  </>
                )}
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
                className="bg-violet-600 hover:bg-violet-700"
                disabled={
                  submitting ||
                  !form.schemeName ||
                  !form.schemeCode ||
                  !form.units ||
                  !form.investedAmount
                }
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {submitting ? "Adding..." : "Add Fund"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
