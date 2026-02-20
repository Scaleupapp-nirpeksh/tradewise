"use client";

import { useMemo } from "react";
import { getHoldingTips } from "@/lib/ai-buddy/tips";
import { TipCard } from "@/components/ai-buddy/tip-card";

interface HoldingTipsProps {
  unrealizedPnlPct: number;
  buyDate: string;
  investedValue: number;
  totalPortfolioValue?: number;
}

export function HoldingTips(props: HoldingTipsProps) {
  const tips = useMemo(
    () => getHoldingTips(props),
    [props.unrealizedPnlPct, props.buyDate, props.investedValue, props.totalPortfolioValue]
  );

  if (tips.length === 0) return null;

  return <TipCard tips={tips} compact maxVisible={2} />;
}
