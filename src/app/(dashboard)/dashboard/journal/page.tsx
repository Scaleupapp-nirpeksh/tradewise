"use client";

import { useState, useEffect } from "react";
import { BookOpen, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/charges";

interface Trade {
  id: string;
  symbol: string;
  side: string;
  netPnl: number | null;
  grossPnl: number | null;
  notes: string | null;
  emotionTag: string | null;
  setupRating: string | null;
  createdAt: string;
  strategy: { name: string } | null;
}

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiReview, setAiReview] = useState<string>("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetch("/api/trades?status=CLOSED&limit=100")
      .then((r) => r.json())
      .then((data) => {
        setTrades(data.trades || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAiReview = async () => {
    setReviewing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeIds: trades.slice(0, 20).map((t) => t.id) }),
      });
      const data = await res.json();
      setAiReview(data.analysis || "Unable to analyze.");
    } catch {
      setAiReview("Unable to analyze right now. Please try again later.");
    }
    setReviewing(false);
  };

  // Group trades by date
  const tradesByDate: Record<string, Trade[]> = {};
  trades.forEach((t) => {
    const date = new Date(t.createdAt).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!tradesByDate[date]) tradesByDate[date] = [];
    tradesByDate[date].push(t);
  });

  const emotionColor: Record<string, string> = {
    PLANNED: "bg-emerald-100 text-emerald-700",
    CONFIDENT: "bg-blue-100 text-blue-700",
    FOMO: "bg-red-100 text-red-700",
    REVENGE: "bg-red-100 text-red-700",
    IMPULSE: "bg-amber-100 text-amber-700",
    UNCERTAIN: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-600" />
            Trade Journal
          </h1>
          <p className="text-muted-foreground text-sm">
            Review your trades and learn from your patterns
          </p>
        </div>
        <Button
          onClick={handleAiReview}
          disabled={reviewing || trades.length === 0}
          variant="outline"
          className="border-violet-300 text-violet-700"
        >
          <Brain className={`h-4 w-4 mr-2 ${reviewing ? "animate-pulse" : ""}`} />
          {reviewing ? "Analyzing..." : "AI Review"}
        </Button>
      </div>

      {/* AI Review */}
      {aiReview && (
        <Card className="border-violet-200 bg-violet-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-600" />
              AI Trading Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-line text-sm">{aiReview}</div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading journal...
        </div>
      ) : trades.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-amber-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              Your journal is empty
            </h3>
            <p className="text-muted-foreground">
              Close some trades to see them here with your notes and emotions.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(tradesByDate).map(([date, dayTrades]) => {
          const dayPnl = dayTrades.reduce(
            (sum, t) => sum + (t.netPnl || 0),
            0
          );
          return (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{date}</h2>
                <span
                  className={`font-bold ${dayPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {dayPnl >= 0 ? "+" : ""}
                  {formatINR(dayPnl)}
                </span>
              </div>
              {dayTrades.map((trade) => (
                <Card key={trade.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              trade.side === "BUY"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {trade.side}
                          </Badge>
                          <span className="font-medium">{trade.symbol}</span>
                          {trade.strategy && (
                            <Badge variant="outline">
                              {trade.strategy.name}
                            </Badge>
                          )}
                          {trade.emotionTag && (
                            <Badge
                              className={
                                emotionColor[trade.emotionTag] || ""
                              }
                            >
                              {trade.emotionTag}
                            </Badge>
                          )}
                        </div>
                        {trade.notes && (
                          <p className="text-sm text-muted-foreground">
                            {trade.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`font-bold ${
                          (trade.netPnl || 0) >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {(trade.netPnl || 0) >= 0 ? "+" : ""}
                        {formatINR(trade.netPnl || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
