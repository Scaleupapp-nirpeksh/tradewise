"use client";

import { useMemo } from "react";
import { getMfTips } from "@/lib/ai-buddy/tips";
import { TipCard } from "@/components/ai-buddy/tip-card";

interface MfTipsProps {
  unrealizedPnlPct: number;
  category: string | null;
  isSip: boolean;
  createdAt: string;
}

export function MfTips(props: MfTipsProps) {
  const tips = useMemo(
    () => getMfTips(props),
    [props.unrealizedPnlPct, props.category, props.isSip, props.createdAt]
  );

  if (tips.length === 0) return null;

  return <TipCard tips={tips} compact maxVisible={2} />;
}
