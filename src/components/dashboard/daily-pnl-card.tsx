import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatINR } from "@/lib/charges";

export function DailyPnlCard({ pnl }: { pnl: number }) {
  const isPositive = pnl > 0;
  const isZero = pnl === 0;

  return (
    <Card
      className={
        isZero
          ? "border-gray-200"
          : isPositive
            ? "border-emerald-200 bg-emerald-50/50"
            : "border-red-200 bg-red-50/50"
      }
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Today&apos;s P&L
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                isZero
                  ? "text-gray-900"
                  : isPositive
                    ? "text-emerald-700"
                    : "text-red-700"
              }`}
            >
              {isPositive ? "+" : ""}
              {formatINR(pnl)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              After all charges
            </p>
          </div>
          <div
            className={`p-3 rounded-full ${
              isZero
                ? "bg-gray-100"
                : isPositive
                  ? "bg-emerald-100"
                  : "bg-red-100"
            }`}
          >
            {isZero ? (
              <Minus className="h-6 w-6 text-gray-500" />
            ) : isPositive ? (
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
