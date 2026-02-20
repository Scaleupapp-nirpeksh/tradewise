"use client";

import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface GoalSummary {
  id: string;
  type: string;
  targetValue: number;
  currentValue: number;
  period: string;
}

const goalTypeLabels: Record<string, string> = {
  NET_PNL: "Net P&L",
  WIN_RATE: "Win Rate",
  MAX_LOSS_PER_TRADE: "Max Loss/Trade",
  TOTAL_TRADES: "Total Trades",
};

export function GoalProgressSummary({ goals }: { goals: GoalSummary[] }) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-600" />
          Goal Progress
        </CardTitle>
        <Link
          href="/dashboard/goals"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.map((goal) => {
          const pct = goal.targetValue > 0
            ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
            : 0;
          const isNearComplete = pct >= 80;

          return (
            <div key={goal.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {goalTypeLabels[goal.type] || goal.type}{" "}
                  <span className="text-xs">({goal.period.toLowerCase()})</span>
                </span>
                <span className={`font-medium ${isNearComplete ? "text-emerald-600" : ""}`}>
                  {goal.type === "WIN_RATE"
                    ? `${goal.currentValue.toFixed(0)}% / ${goal.targetValue}%`
                    : `₹${goal.currentValue.toLocaleString("en-IN")} / ₹${goal.targetValue.toLocaleString("en-IN")}`}
                </span>
              </div>
              <Progress
                value={pct}
                className="h-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
