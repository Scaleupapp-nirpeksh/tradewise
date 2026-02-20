"use client";

import { useEffect, useState } from "react";
import { Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";
import { isMarketOpen } from "@/lib/market-hours";

interface NextActionData {
  hasOpenPositions: boolean;
  positionsWithoutSl: number;
  hasTradesToday: boolean;
  hasGoals: boolean;
  dailyLossExceeded: boolean;
}

export function NextAction() {
  const [action, setAction] = useState<{
    message: string;
    href: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/guidance/next-action")
      .then((r) => r.json())
      .then((data: NextActionData) => {
        const marketOpen = isMarketOpen();

        if (data.dailyLossExceeded) {
          setAction({
            message:
              "You've hit your daily loss limit. Consider taking a break and reviewing what happened.",
            href: "/dashboard/journal",
            label: "Write in Journal",
          });
        } else if (data.positionsWithoutSl > 0) {
          setAction({
            message: `You have ${data.positionsWithoutSl} position${data.positionsWithoutSl > 1 ? "s" : ""} without a stop-loss. Set one to protect your capital.`,
            href: "/dashboard/trades",
            label: "View Positions",
          });
        } else if (marketOpen && !data.hasTradesToday && !data.hasOpenPositions) {
          setAction({
            message:
              "Market is open! Check AI suggestions for today's trade ideas.",
            href: "/dashboard/suggestions",
            label: "View Suggestions",
          });
        } else if (!marketOpen && data.hasTradesToday) {
          setAction({
            message:
              "Market is closed. Review today's trades and write your thoughts in the journal.",
            href: "/dashboard/journal",
            label: "Write in Journal",
          });
        } else if (!data.hasGoals) {
          setAction({
            message:
              "Set a trading goal to stay disciplined. Start with a simple daily P&L target.",
            href: "/dashboard/goals",
            label: "Set a Goal",
          });
        } else if (data.hasOpenPositions && marketOpen) {
          setAction({
            message:
              "You have open positions. Monitor them and get AI advice on whether to hold or sell.",
            href: "/dashboard",
            label: "View Dashboard",
          });
        } else {
          setAction(null);
        }
      })
      .catch(() => {});
  }, []);

  if (!action) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-blue-900">{action.message}</p>
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 mt-1"
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
