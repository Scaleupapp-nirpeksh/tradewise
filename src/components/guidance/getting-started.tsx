"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, X, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface GuidanceProgress {
  addedFirstTrade?: boolean;
  setTargetSl?: boolean;
  viewedSuggestions?: boolean;
  reviewedAnalytics?: boolean;
  setGoal?: boolean;
  connectedBroker?: boolean;
  dismissed?: boolean;
}

const STEPS = [
  {
    key: "addedFirstTrade",
    label: "Add your first trade",
    href: "/dashboard/trades/new",
    description: "Record a trade to start tracking your performance",
  },
  {
    key: "setTargetSl",
    label: "Set a target & stop-loss",
    href: "/dashboard/trades/new",
    description: "Protect your capital by setting exit points",
  },
  {
    key: "viewedSuggestions",
    label: "Check AI suggestions",
    href: "/dashboard/suggestions",
    description: "Get trade ideas based on market data",
  },
  {
    key: "reviewedAnalytics",
    label: "Review your analytics",
    href: "/dashboard/analytics",
    description: "Understand your trading patterns",
  },
  {
    key: "setGoal",
    label: "Set a trading goal",
    href: "/dashboard/goals",
    description: "Stay disciplined with clear targets",
  },
  {
    key: "connectedBroker",
    label: "Connect your broker",
    href: "/dashboard/settings",
    description: "Auto-import trades from Groww",
  },
];

export function GettingStarted() {
  const [progress, setProgress] = useState<GuidanceProgress>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        const gp = data.user?.guidanceProgress as GuidanceProgress | null;
        if (gp) setProgress(gp);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDismiss = async () => {
    const updated = { ...progress, dismissed: true };
    setProgress(updated);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guidanceProgress: updated }),
    });
  };

  if (loading || progress.dismissed) return null;

  const completedCount = STEPS.filter(
    (s) => progress[s.key as keyof GuidanceProgress]
  ).length;

  if (completedCount >= STEPS.length) return null;

  return (
    <Card className="border-emerald-200 bg-emerald-50/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="h-4 w-4 text-emerald-600" />
          Getting Started
          <span className="text-xs text-muted-foreground font-normal">
            {completedCount}/{STEPS.length}
          </span>
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {STEPS.map((step) => {
          const done = progress[step.key as keyof GuidanceProgress];
          return (
            <Link
              key={step.key}
              href={step.href}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors group"
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300 mt-0.5 shrink-0 group-hover:text-emerald-400" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    done ? "text-emerald-700 line-through" : "text-gray-800"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
