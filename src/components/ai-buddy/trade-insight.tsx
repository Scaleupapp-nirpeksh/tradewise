"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { TipCard } from "@/components/ai-buddy/tip-card";
import { BuddyTip } from "@/lib/ai-buddy/tips";

interface TradeInsightProps {
  tradeId: string;
}

export function TradeInsight({ tradeId }: TradeInsightProps) {
  const [tips, setTips] = useState<BuddyTip[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/ai-buddy/trade-insight?tradeId=${tradeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTips(data.tips || []);
      })
      .catch(() => {
        if (!cancelled) setTips([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tradeId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
        <Loader2 className="h-3 w-3 animate-spin" />
        Analyzing trade...
      </div>
    );
  }

  if (!tips || tips.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">AI Insight</p>
      <TipCard tips={tips} compact />
    </div>
  );
}
