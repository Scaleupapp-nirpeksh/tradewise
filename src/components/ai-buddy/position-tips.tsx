"use client";

import { useMemo } from "react";
import { getPositionTips } from "@/lib/ai-buddy/tips";
import { TipCard } from "@/components/ai-buddy/tip-card";

interface PositionTipsProps {
  unrealizedPnlPct: number;
  stopLossPrice: number | null;
  targetPrice: number | null;
  distanceToTarget: number | null;
  distanceToStopLoss: number | null;
  entryTime: string;
}

export function PositionTips(props: PositionTipsProps) {
  const tips = useMemo(
    () => getPositionTips(props),
    [props.unrealizedPnlPct, props.stopLossPrice, props.targetPrice, props.distanceToTarget, props.distanceToStopLoss, props.entryTime]
  );

  if (tips.length === 0) return null;

  return <TipCard tips={tips} compact maxVisible={2} />;
}
