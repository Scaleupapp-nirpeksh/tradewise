"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StockHoldingWithLive } from "@/types";
import { DeliveryChargeBreakdown } from "@/components/shared/delivery-charge-breakdown";

interface SellHoldingDialogProps {
  holding: StockHoldingWithLive;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSold: () => void;
}

export function SellHoldingDialog({
  holding,
  open,
  onOpenChange,
  onSold,
}: SellHoldingDialogProps) {
  const [sellQty, setSellQty] = useState(holding.quantity.toString());
  const [sellPrice, setSellPrice] = useState(
    holding.currentPrice.toString()
  );
  const [selling, setSelling] = useState(false);

  const qty = parseInt(sellQty) || 0;
  const price = parseFloat(sellPrice) || 0;
  const grossPnl = (price - holding.buyPrice) * qty;

  const handleSell = async () => {
    if (qty <= 0 || price <= 0) return;
    setSelling(true);
    try {
      if (qty >= holding.quantity) {
        // Sell all — delete holding
        await fetch(`/api/holdings/${holding.id}`, { method: "DELETE" });
      } else {
        // Partial sell
        await fetch(`/api/holdings/${holding.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sellQuantity: qty }),
        });
      }
      onSold();
    } catch (error) {
      console.error("Failed to sell:", error);
    }
    setSelling(false);
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sell {holding.symbol}</DialogTitle>
          <DialogDescription>
            Enter the number of shares and the sell price. We&apos;ll calculate
            your profit/loss including delivery charges.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">You Own</p>
              <p className="font-medium">{holding.quantity} shares</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Buy Price</p>
              <p className="font-medium">{formatINR(holding.buyPrice)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Price</p>
              <p className="font-medium">{formatINR(holding.currentPrice)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellQty">How many shares to sell?</Label>
              <Input
                id="sellQty"
                type="number"
                min="1"
                max={holding.quantity}
                value={sellQty}
                onChange={(e) => setSellQty(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Max: {holding.quantity}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  id="sellPrice"
                  type="number"
                  step="0.05"
                  className="pl-7"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pre-filled with current price
              </p>
            </div>
          </div>

          {qty > 0 && price > 0 && (
            <>
              {/* P&L Preview */}
              <div
                className={`rounded-lg p-3 text-center ${grossPnl >= 0 ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900" : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900"} border`}
              >
                <p className="text-sm text-muted-foreground">
                  Estimated {grossPnl >= 0 ? "Profit" : "Loss"}
                </p>
                <p
                  className={`text-xl font-bold ${grossPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {grossPnl >= 0 ? "+" : ""}
                  {formatINR(grossPnl)}
                </p>
              </div>

              <DeliveryChargeBreakdown
                buyPrice={holding.buyPrice}
                sellPrice={price}
                quantity={qty}
              />
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleSell}
            disabled={selling || qty <= 0 || price <= 0 || qty > holding.quantity}
          >
            {selling && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {selling ? "Selling..." : `Sell ${qty} shares`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
