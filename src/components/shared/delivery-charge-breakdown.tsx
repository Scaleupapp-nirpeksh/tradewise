"use client";

import { useMemo } from "react";
import { calculateDeliveryCharges } from "@/lib/charges";

interface DeliveryChargeBreakdownProps {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  exchange?: string;
}

export function DeliveryChargeBreakdown({
  buyPrice,
  sellPrice,
  quantity,
  exchange = "NSE",
}: DeliveryChargeBreakdownProps) {
  const charges = useMemo(
    () => calculateDeliveryCharges(buyPrice, sellPrice, quantity, exchange),
    [buyPrice, sellPrice, quantity, exchange]
  );

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <div className="rounded-lg p-3 bg-muted/50 border">
      <p className="text-xs font-medium mb-2">
        Delivery Trading Charges
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Brokerage (₹20 x 2 orders)</span>
          <span>{formatINR(charges.brokerage)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">STT (0.1% on buy + sell)</span>
          <span>{formatINR(charges.stt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Exchange Charges</span>
          <span>{formatINR(charges.exchangeCharges)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">GST (18%)</span>
          <span>{formatINR(charges.gst)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">SEBI Charges</span>
          <span>{formatINR(charges.sebiCharges)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Stamp Duty (0.015%)</span>
          <span>{formatINR(charges.stampDuty)}</span>
        </div>
        <div className="flex justify-between pt-1 border-t font-medium">
          <span>Total Charges</span>
          <span className="text-red-600">{formatINR(charges.totalCharges)}</span>
        </div>
      </div>
    </div>
  );
}
