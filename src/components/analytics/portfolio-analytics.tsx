"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/charges";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Holding {
  symbol: string;
  currentValue: number;
  unrealizedPnlPct: number;
}

interface Fund {
  schemeName: string;
  category: string | null;
  currentValue: number;
  unrealizedPnlPct: number;
}

const ALLOCATION_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4"];
const CATEGORY_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#06b6d4", "#6b7280"];

export function PortfolioAnalytics() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [capital, setCapital] = useState(0);
  const [holdingsTotal, setHoldingsTotal] = useState(0);
  const [fundsTotal, setFundsTotal] = useState(0);
  const [holdingsInvested, setHoldingsInvested] = useState(0);
  const [fundsInvested, setFundsInvested] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [holdingsRes, fundsRes, profileRes] = await Promise.all([
          fetch("/api/holdings"),
          fetch("/api/mutual-funds"),
          fetch("/api/user/profile"),
        ]);
        const [holdingsData, fundsData, profileData] = await Promise.all([
          holdingsRes.json(),
          fundsRes.json(),
          profileRes.json(),
        ]);

        setHoldings(holdingsData.holdings || []);
        setHoldingsTotal(holdingsData.totalCurrentValue || 0);
        setHoldingsInvested(holdingsData.totalInvested || 0);
        setFunds(fundsData.funds || []);
        setFundsTotal(fundsData.totalCurrentValue || 0);
        setFundsInvested(fundsData.totalInvested || 0);
        setCapital(profileData.capitalAmount || 0);
      } catch (error) {
        console.error("Failed to load portfolio analytics:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading portfolio analytics...
      </div>
    );
  }

  if (holdings.length === 0 && funds.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No portfolio data yet</p>
          <p className="text-sm">
            Add stock holdings or mutual funds to see your portfolio analytics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = capital + holdingsTotal + fundsTotal;
  const totalInvested = holdingsInvested + fundsInvested;
  const totalReturns = (holdingsTotal - holdingsInvested) + (fundsTotal - fundsInvested);
  const totalReturnsPct = totalInvested > 0
    ? Math.round((totalReturns / totalInvested) * 10000) / 100
    : 0;

  // Asset allocation data
  const allocationData = [
    ...(capital > 0 ? [{ name: "Trading Capital", value: Math.round(capital) }] : []),
    ...(holdingsTotal > 0 ? [{ name: "Stocks", value: Math.round(holdingsTotal) }] : []),
    ...(fundsTotal > 0 ? [{ name: "Mutual Funds", value: Math.round(fundsTotal) }] : []),
  ];

  // MF category breakdown
  const categoryMap: Record<string, number> = {};
  funds.forEach((f) => {
    const cat = f.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + f.currentValue;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // Top & bottom performers
  const sortedHoldings = [...holdings].sort(
    (a, b) => b.unrealizedPnlPct - a.unrealizedPnlPct
  );
  const topPerformers = sortedHoldings.slice(0, 3);
  const bottomPerformers = sortedHoldings
    .filter((h) => h.unrealizedPnlPct < 0)
    .reverse()
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Portfolio</p>
            <p className="text-2xl font-bold">{formatINR(totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Everything you own
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <p className="text-2xl font-bold">{formatINR(totalInvested)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              In stocks + mutual funds
            </p>
          </CardContent>
        </Card>
        <Card className={totalReturns >= 0 ? "border-emerald-200 dark:border-emerald-900" : "border-red-200 dark:border-red-900"}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overall Returns</p>
            <p className={`text-2xl font-bold ${totalReturns >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {totalReturns >= 0 ? "+" : ""}{formatINR(totalReturns)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalReturnsPct >= 0 ? "+" : ""}{totalReturnsPct}% on investments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Investments</p>
            <p className="text-2xl font-bold">{holdings.length + funds.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {holdings.length} stocks, {funds.length} funds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        {allocationData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Where Your Money Is</CardTitle>
              <p className="text-xs text-muted-foreground">
                How your money is split across trading capital, stocks, and mutual funds.
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatINR(value)}`}
                  >
                    {allocationData.map((_, index) => (
                      <Cell key={index} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatINR(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* MF Category Breakdown */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mutual Fund Categories</CardTitle>
              <p className="text-xs text-muted-foreground">
                How your mutual funds are spread across different types.
                A good mix of equity and debt reduces risk.
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatINR(value)}`}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatINR(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top/Bottom Performers */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Best Stocks</CardTitle>
              <p className="text-xs text-muted-foreground">
                Top performers by percentage gain. Keep doing what works!
              </p>
            </CardHeader>
            <CardContent>
              {topPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No profitable holdings yet
                </p>
              ) : (
                <div className="space-y-3">
                  {topPerformers.map((h, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-5">
                          #{i + 1}
                        </span>
                        <span className="font-medium">{h.symbol}</span>
                      </div>
                      <span className="font-semibold text-emerald-600">
                        +{h.unrealizedPnlPct}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stocks Needing Attention</CardTitle>
              <p className="text-xs text-muted-foreground">
                Holdings that are down. Consider if your original reason for buying still holds.
              </p>
            </CardHeader>
            <CardContent>
              {bottomPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No holdings in the red — great job!
                </p>
              ) : (
                <div className="space-y-3">
                  {bottomPerformers.map((h, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-5">
                          #{i + 1}
                        </span>
                        <span className="font-medium">{h.symbol}</span>
                      </div>
                      <span className="font-semibold text-red-600">
                        {h.unrealizedPnlPct}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
