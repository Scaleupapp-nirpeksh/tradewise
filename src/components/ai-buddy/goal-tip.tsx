"use client";

import { useMemo } from "react";
import { getGoalTips } from "@/lib/ai-buddy/tips";
import { TipCard } from "@/components/ai-buddy/tip-card";

interface GoalTipProps {
  type: string;
  targetValue: number;
  currentValue: number;
  period: string;
  startDate: string;
  endDate: string;
  achieved: boolean;
}

export function GoalTip(props: GoalTipProps) {
  const tips = useMemo(() => getGoalTips(props), [
    props.type,
    props.targetValue,
    props.currentValue,
    props.period,
    props.startDate,
    props.endDate,
    props.achieved,
  ]);

  return <TipCard tips={tips} compact />;
}
