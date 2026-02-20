"use client";

import { useState, useEffect } from "react";
import { Briefcase, PiggyBank, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/charges";

interface ActivityItem {
  id: string;
  type: "stock" | "fund";
  title: string;
  description: string;
  amount: number;
  pnl: number;
  pnlPct: number;
  date: string;
}

export function PortfolioActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const [holdingsRes, fundsRes] = await Promise.all([
          fetch("/api/holdings"),
          fetch("/api/mutual-funds"),
        ]);
        const [holdingsData, fundsData] = await Promise.all([
          holdingsRes.json(),
          fundsRes.json(),
        ]);

        const items: ActivityItem[] = [];

        // Convert holdings to activity items
        for (const h of holdingsData.holdings || []) {
          items.push({
            id: h.id,
            type: "stock",
            title: `Bought ${h.quantity} shares of ${h.symbol}`,
            description: `at ${formatINR(h.buyPrice)} per share`,
            amount: h.investedValue,
            pnl: h.unrealizedPnl,
            pnlPct: h.unrealizedPnlPct,
            date: h.buyDate,
          });
        }

        // Convert funds to activity items
        for (const f of fundsData.funds || []) {
          items.push({
            id: f.id,
            type: "fund",
            title: `Invested in ${f.schemeName}`,
            description: f.isSip
              ? `SIP: ${formatINR(f.sipAmount || 0)}/month`
              : "Lumpsum investment",
            amount: f.investedAmount,
            pnl: f.unrealizedPnl,
            pnlPct: f.unrealizedPnlPct,
            date: f.createdAt,
          });
        }

        // Sort by date (newest first)
        items.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setActivities(items);
      } catch (error) {
        console.error("Failed to fetch portfolio activity:", error);
      }
      setLoading(false);
    }

    fetchActivity();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading portfolio activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex justify-center gap-3 mb-4">
            <Briefcase className="h-10 w-10 text-blue-300" />
            <PiggyBank className="h-10 w-10 text-violet-300" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No portfolio activity yet</h3>
          <p className="text-muted-foreground text-sm">
            Add stock holdings or mutual fund investments to see your activity timeline here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const grouped: Record<string, ActivityItem[]> = {};
  activities.forEach((item) => {
    const dateKey = new Date(item.date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(item);
  });

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="space-y-3">
          <h2 className="font-semibold text-lg">{date}</h2>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        item.type === "stock"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                          : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400"
                      }`}
                    >
                      {item.type === "stock" ? (
                        <Briefcase className="h-4 w-4" />
                      ) : (
                        <PiggyBank className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.title}</p>
                        <Badge
                          variant="outline"
                          className="text-xs py-0"
                        >
                          {item.type === "stock" ? "Stock" : "Mutual Fund"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description} · Invested {formatINR(item.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold text-sm ${
                        item.pnl >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {item.pnl >= 0 ? "+" : ""}
                      {formatINR(item.pnl)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.pnlPct >= 0 ? "+" : ""}
                      {item.pnlPct}% since purchase
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
