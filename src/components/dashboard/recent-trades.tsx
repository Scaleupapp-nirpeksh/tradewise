import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import { formatINR } from "@/lib/charges";

interface TradeWithStrategy {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  netPnl: number | null;
  status: string;
  createdAt: Date;
  strategy: { name: string } | null;
}

export function RecentTrades({ trades }: { trades: TradeWithStrategy[] }) {
  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Trades</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No trades yet. Add your first trade to get started!
          </p>
          <Link href="/dashboard/trades/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Trade
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Recent Trades</CardTitle>
        <Link href="/dashboard/trades">
          <Button variant="ghost" size="sm">
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={trade.side === "BUY" ? "default" : "secondary"}
                  className={
                    trade.side === "BUY"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {trade.side}
                </Badge>
                <div>
                  <p className="font-medium text-sm">{trade.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    {trade.quantity} qty @ {formatINR(trade.entryPrice)}
                    {trade.strategy ? ` · ${trade.strategy.name}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {trade.status === "CLOSED" && trade.netPnl !== null ? (
                  <p
                    className={`font-semibold text-sm ${
                      trade.netPnl >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {trade.netPnl >= 0 ? "+" : ""}
                    {formatINR(trade.netPnl)}
                  </p>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    OPEN
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
