"use client";

import { useState } from "react";
import { Loader2, Info } from "lucide-react";
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
import { MutualFundWithLive } from "@/types";

interface RedeemFundDialogProps {
  fund: MutualFundWithLive;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRedeemed: () => void;
}

export function RedeemFundDialog({
  fund,
  open,
  onOpenChange,
  onRedeemed,
}: RedeemFundDialogProps) {
  const [redeemUnits, setRedeemUnits] = useState(fund.units.toFixed(3));
  const [redeeming, setRedeeming] = useState(false);

  const units = parseFloat(redeemUnits) || 0;
  const redeemValue = units * fund.currentNav;
  const investedPortion =
    fund.units > 0 ? (units / fund.units) * fund.investedAmount : 0;
  const pnl = redeemValue - investedPortion;

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);

  const handleRedeem = async () => {
    if (units <= 0) return;
    setRedeeming(true);
    try {
      if (units >= fund.units - 0.001) {
        // Redeem all — delete
        await fetch(`/api/mutual-funds/${fund.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/mutual-funds/${fund.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redeemUnits: units }),
        });
      }
      onRedeemed();
    } catch (error) {
      console.error("Failed to redeem:", error);
    }
    setRedeeming(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redeem Fund</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {fund.schemeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Units Owned</p>
              <p className="font-medium">{fund.units.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current NAV</p>
              <p className="font-medium">₹{fund.currentNav.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Value</p>
              <p className="font-medium">{formatINR(fund.currentValue)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redeemUnits">How many units to redeem?</Label>
            <div className="flex gap-2">
              <Input
                id="redeemUnits"
                type="number"
                step="0.001"
                min="0.001"
                max={fund.units}
                value={redeemUnits}
                onChange={(e) => setRedeemUnits(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRedeemUnits(fund.units.toFixed(3))}
              >
                All
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the number of units you want to redeem, or click
              &quot;All&quot; to redeem everything.
            </p>
          </div>

          {units > 0 && (
            <>
              <div
                className={`rounded-lg p-3 text-center ${pnl >= 0 ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900" : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900"} border`}
              >
                <p className="text-sm text-muted-foreground">
                  You&apos;ll get approximately
                </p>
                <p className="text-xl font-bold">{formatINR(redeemValue)}</p>
                <p
                  className={`text-sm ${pnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {pnl >= 0 ? "Profit" : "Loss"}: {pnl >= 0 ? "+" : ""}
                  {formatINR(pnl)}
                </p>
              </div>

              <div className="flex gap-2 items-start text-xs text-muted-foreground bg-muted/50 rounded p-2.5">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Some funds charge an exit load (typically 1%) if you redeem
                  within 1 year. The actual amount you receive may differ
                  slightly from this estimate.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleRedeem}
            disabled={redeeming || units <= 0 || units > fund.units + 0.001}
          >
            {redeeming && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {redeeming ? "Redeeming..." : "Redeem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
