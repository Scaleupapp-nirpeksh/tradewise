"use client";

import { useMemo } from "react";
import { getCloseTradeTips } from "@/lib/ai-buddy/tips";
import { TipCard } from "@/components/ai-buddy/tip-card";

interface CloseTradeTipsProps {
  side: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLossPrice?: number | null;
  entryTime?: string | null;
}

export function CloseTradeTips(props: CloseTradeTipsProps) {
  const tips = useMemo(
    () => getCloseTradeTips(props),
    [props.side, props.entryPrice, props.exitPrice, props.quantity, props.stopLossPrice, props.entryTime]
  );

  return <TipCard tips={tips} compact />;
}
