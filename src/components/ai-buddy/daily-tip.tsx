"use client";

import { useState, useEffect } from "react";
import { TipCard } from "@/components/ai-buddy/tip-card";
import { BuddyTip, getDailyTip } from "@/lib/ai-buddy/tips";

export function DailyTip() {
  const [tip, setTip] = useState<BuddyTip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai-buddy/daily-tip")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) {
          const result = getDailyTip(data.stats);
          setTip(result);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !tip) return null;

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">Daily Tip</p>
      <TipCard tips={[tip]} compact />
    </div>
  );
}
