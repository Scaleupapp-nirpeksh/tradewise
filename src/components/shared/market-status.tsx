"use client";

import { useState, useEffect } from "react";
import { getMarketStatus } from "@/lib/market-hours";

export function MarketStatus() {
  const [status, setStatus] = useState(getMarketStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getMarketStatus());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs">
      <span
        className={`h-2 w-2 rounded-full ${
          status.isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-400"
        }`}
      />
      <div>
        <p className="font-medium">{status.message}</p>
        <p className="text-muted-foreground">{status.nextEvent}</p>
      </div>
    </div>
  );
}
