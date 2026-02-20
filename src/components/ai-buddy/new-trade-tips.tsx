"use client";

import { useMemo, useEffect, useState } from "react";
import { getNewTradeTips, TradeFormContext } from "@/lib/ai-buddy/tips";
import { TipCard } from "@/components/ai-buddy/tip-card";

interface NewTradeTipsProps {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: string;
  entryPrice: string;
  targetPrice: string;
  stopLossPrice: string;
  emotionTag: string;
}

export function NewTradeTips(props: NewTradeTipsProps) {
  const [context, setContext] = useState<TradeFormContext | null>(null);

  useEffect(() => {
    fetch("/api/ai-buddy/trade-context")
      .then((r) => r.json())
      .then(setContext)
      .catch(() => {});
  }, []);

  const tips = useMemo(
    () =>
      getNewTradeTips({
        ...props,
        context,
      }),
    [props.symbol, props.side, props.quantity, props.entryPrice, props.targetPrice, props.stopLossPrice, props.emotionTag, context]
  );

  if (tips.length === 0) return null;

  return <TipCard tips={tips} className="mt-2" />;
}
