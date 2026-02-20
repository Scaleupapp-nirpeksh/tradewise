"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/charges";
import { AnalyticsCoaching } from "@/components/ai-buddy/analytics-coaching";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface Trade {
  id: string;
  symbol: string;
  side: string;
  netPnl: number | null;
  grossPnl: number | null;
  status: string;
  createdAt: string;
  strategy: { name: string } | null;
  emotionTag: string | null;
}

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trades?status=CLOSED&limit=500")
      .then((r) => r.json())
      .then((data) => {
        setTrades(data.trades || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            Your trading performance at a glance — see what&apos;s working and what needs improvement.
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              No data to analyze yet
            </h3>
            <p className="text-muted-foreground">
              Close some trades to see your analytics here. We&apos;ll show you your win rate,
              P&L trends, and which strategies work best.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winners = trades.filter((t) => (t.netPnl || 0) > 0);
  const losers = trades.filter((t) => (t.netPnl || 0) < 0);
  const totalPnl = trades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const avgWin =
    winners.length > 0
      ? winners.reduce((sum, t) => sum + (t.netPnl || 0), 0) / winners.length
      : 0;
  const avgLoss =
    losers.length > 0
      ? losers.reduce((sum, t) => sum + (t.netPnl || 0), 0) / losers.length
      : 0;
  const winRate =
    trades.length > 0 ? (winners.length / trades.length) * 100 : 0;
  const biggestWin = Math.max(...trades.map((t) => t.netPnl || 0), 0);
  const biggestLoss = Math.min(...trades.map((t) => t.netPnl || 0), 0);
  const rrRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  // Win/Loss pie data
  const pieData = [
    { name: "Winners", value: winners.length, color: "#059669" },
    { name: "Losers", value: losers.length, color: "#dc2626" },
  ];

  // Daily P&L data
  const dailyPnl: Record<string, number> = {};
  trades.forEach((t) => {
    const date = new Date(t.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    dailyPnl[date] = (dailyPnl[date] || 0) + (t.netPnl || 0);
  });
  const dailyData = Object.entries(dailyPnl)
    .map(([date, pnl]) => ({
      date,
      pnl: Math.round(pnl),
    }))
    .reverse()
    .slice(-14);

  // Cumulative P&L
  let cumulative = 0;
  const cumulativeData = dailyData.map((d) => {
    cumulative += d.pnl;
    return { ...d, cumulative: Math.round(cumulative) };
  });

  // Strategy breakdown
  const strategyPnl: Record<string, { pnl: number; count: number }> = {};
  trades.forEach((t) => {
    const name = t.strategy?.name || "No Strategy";
    if (!strategyPnl[name]) strategyPnl[name] = { pnl: 0, count: 0 };
    strategyPnl[name].pnl += t.netPnl || 0;
    strategyPnl[name].count++;
  });
  const strategyData = Object.entries(strategyPnl).map(([name, data]) => ({
    name,
    pnl: Math.round(data.pnl),
    count: data.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm">
          Your trading performance at a glance — see what&apos;s working and what needs improvement.
        </p>
      </div>

      <AnalyticsCoaching trades={trades} />

      {/* Summary Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={totalPnl >= 0 ? "border-emerald-200 dark:border-emerald-900" : "border-red-200 dark:border-red-900"}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total P&L</p>
            <p
              className={`text-2xl font-bold ${totalPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatINR(totalPnl)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your total earnings/losses after all charges
            </p>
          </CardContent>
        </Card>
        <Card className={winRate >= 50 ? "border-emerald-200 dark:border-emerald-900" : winRate >= 40 ? "" : "border-red-200 dark:border-red-900"}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {winners.length}W / {losers.length}L — above 50% is good!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Win</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatINR(avgWin)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Average profit on winning trades
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Loss</p>
            <p className="text-2xl font-bold text-red-600">
              {formatINR(Math.abs(avgLoss))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Average loss on losing trades — lower is better
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-2xl font-bold">{trades.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Closed trades analyzed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Biggest Win</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatINR(biggestWin)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your best single trade
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Biggest Loss</p>
            <p className="text-2xl font-bold text-red-600">
              {formatINR(Math.abs(biggestLoss))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your worst single trade
            </p>
          </CardContent>
        </Card>
        <Card className={rrRatio >= 1.5 ? "border-emerald-200 dark:border-emerald-900" : rrRatio >= 1 ? "" : "border-red-200 dark:border-red-900"}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Risk/Reward</p>
            <p className="text-2xl font-bold">
              {rrRatio > 0 ? rrRatio.toFixed(2) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              How much you make vs lose — above 1.5 is healthy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily P&L */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily P&L</CardTitle>
            <p className="text-xs text-muted-foreground">
              How much you made or lost each day. Green = profit, red = loss.
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  formatter={(value) => [formatINR(Number(value)), "P&L"]}
                />
                <Bar
                  dataKey="pnl"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win Rate Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Win/Loss Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">
              Out of all your trades, how many were winners vs losers.
            </p>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative P&L */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cumulative P&L</CardTitle>
            <p className="text-xs text-muted-foreground">
              Your running total over time — is the line going up? That&apos;s good!
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  formatter={(value) => [
                    formatINR(Number(value)),
                    "Cumulative",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategy Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Strategy Performance</CardTitle>
            <p className="text-xs text-muted-foreground">
              Which strategies are making you money vs losing it. Focus on what works!
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={strategyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={120} />
                <Tooltip
                  formatter={(value) => [formatINR(Number(value)), "P&L"]}
                />
                <Bar dataKey="pnl" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
