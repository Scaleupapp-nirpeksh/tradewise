"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioAdvice {
  advice: string;
}

export function PortfolioHealthCard() {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/portfolio-health", { method: "POST" });
      const data: PortfolioAdvice = await res.json();
      setAdvice(data.advice || "Unable to analyze portfolio right now.");
    } catch {
      setAdvice("Unable to analyze portfolio right now. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-600" />
          Portfolio Health
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          AI analyzes your stocks, mutual funds, and trades to give personalized advice.
        </p>
      </CardHeader>
      <CardContent>
        {!advice && !loading && (
          <div className="text-center py-4">
            <Sparkles className="h-10 w-10 text-violet-300 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              Get a checkup on your overall portfolio — diversification, risk, and what to focus on next.
            </p>
            <Button
              onClick={checkHealth}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              Check Portfolio Health
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Analyzing your portfolio...
            </p>
          </div>
        )}

        {advice && !loading && (
          <div className="space-y-3">
            <div className="bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900 rounded-lg p-4">
              <div className="whitespace-pre-line text-sm text-violet-900 dark:text-violet-200">
                {advice}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              className="text-xs"
            >
              <Brain className="h-3 w-3 mr-1" />
              Refresh Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
