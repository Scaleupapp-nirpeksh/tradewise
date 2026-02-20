"use client";

import { useState, useMemo } from "react";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TipCard } from "@/components/ai-buddy/tip-card";
import { getAnalyticsInsights, BuddyTip } from "@/lib/ai-buddy/tips";

interface Trade {
  netPnl: number | null;
  emotionTag: string | null;
  createdAt: string;
  strategy: { name: string } | null;
}

interface AnalyticsCoachingProps {
  trades: Trade[];
}

export function AnalyticsCoaching({ trades }: AnalyticsCoachingProps) {
  const [aiCoaching, setAiCoaching] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const tips = useMemo(() => getAnalyticsInsights(trades), [trades]);

  const getAiCoaching = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "improvement" }),
      });
      const data = await res.json();
      setAiCoaching(data.analysis || data.suggestions || "No coaching available right now.");
    } catch {
      setAiCoaching("Failed to get AI coaching. Please try again.");
    }
    setAiLoading(false);
  };

  if (tips.length === 0 && !aiCoaching) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Pattern Insights</p>
        {!aiCoaching && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={getAiCoaching}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Brain className="h-3 w-3 mr-1" />
            )}
            Get AI Coaching
          </Button>
        )}
      </div>
      <TipCard tips={tips} maxVisible={4} />
      {aiCoaching && (
        <div className="p-3 rounded-lg border border-violet-200 bg-violet-50 text-sm text-violet-900">
          <p className="font-medium text-xs text-violet-600 mb-1">AI Coaching</p>
          <p className="whitespace-pre-line">{aiCoaching}</p>
        </div>
      )}
    </div>
  );
}
