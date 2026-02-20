"use client";

import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";

interface ChargeBreakdownProps {
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  side: "BUY" | "SELL";
  exchange?: string;
}

function calculateChargesLocal(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  exchange: string = "NSE"
) {
  const buyTurnover = entryPrice * quantity;
  const sellTurnover = exitPrice * quantity;
  const totalTurnover = buyTurnover + sellTurnover;

  // Flat ₹20/order (most discount brokers)
  const brokerage = 20 * 2;
  const stt = (sellTurnover * 0.025) / 100;
  const exchangeRate = exchange === "BSE" ? 0.00375 : 0.00297;
  const exchangeCharges = (totalTurnover * exchangeRate) / 100;
  const gst = ((brokerage + exchangeCharges) * 18) / 100;
  const sebiCharges = (totalTurnover * 10) / 10000000;
  const stampDuty = (buyTurnover * 0.003) / 100;
  const totalCharges = brokerage + stt + exchangeCharges + gst + sebiCharges + stampDuty;

  return {
    brokerage: Math.round(brokerage * 100) / 100,
    stt: Math.round(stt * 100) / 100,
    exchangeCharges: Math.round(exchangeCharges * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    sebiCharges: Math.round(sebiCharges * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(n);

export function ChargeBreakdown({
  entryPrice,
  exitPrice,
  quantity,
  side,
  exchange = "NSE",
}: ChargeBreakdownProps) {
  const breakdown = useMemo(() => {
    if (!entryPrice || !exitPrice || !quantity) return null;
    const charges = calculateChargesLocal(entryPrice, exitPrice, quantity, exchange);
    const grossPnl =
      side === "BUY"
        ? (exitPrice - entryPrice) * quantity
        : (entryPrice - exitPrice) * quantity;
    const netPnl = grossPnl - charges.totalCharges;
    return { ...charges, grossPnl, netPnl };
  }, [entryPrice, exitPrice, quantity, side, exchange]);

  if (!breakdown) return null;

  return (
    <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Gross P&L</span>
        <span className={`font-medium ${breakdown.grossPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {breakdown.grossPnl >= 0 ? "+" : ""}{fmt(breakdown.grossPnl)}
        </span>
      </div>
      <Separator />
      <div className="space-y-1 text-xs">
        <p className="text-muted-foreground font-medium mb-1">Charges breakdown:</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Brokerage (₹20 x 2 orders)</span>
          <span>{fmt(breakdown.brokerage)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">STT (0.025% on sell)</span>
          <span>{fmt(breakdown.stt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Exchange charges</span>
          <span>{fmt(breakdown.exchangeCharges)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">GST (18%)</span>
          <span>{fmt(breakdown.gst)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">SEBI charges</span>
          <span>{fmt(breakdown.sebiCharges)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Stamp duty</span>
          <span>{fmt(breakdown.stampDuty)}</span>
        </div>
      </div>
      <Separator />
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total Charges</span>
        <span className="font-medium text-red-600">-{fmt(breakdown.totalCharges)}</span>
      </div>
      <div className="flex justify-between text-base">
        <span className="font-medium">Net P&L</span>
        <span className={`font-bold ${breakdown.netPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {breakdown.netPnl >= 0 ? "+" : ""}{fmt(breakdown.netPnl)}
        </span>
      </div>
    </div>
  );
}
