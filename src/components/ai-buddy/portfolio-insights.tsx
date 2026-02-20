"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles, PiggyBank, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PortfolioInsights() {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPortfolio, setHasPortfolio] = useState<boolean | null>(null);

  const checkPortfolio = async () => {
    // Quick check if user has any holdings or funds
    try {
      const [holdingsRes, fundsRes] = await Promise.all([
        fetch("/api/holdings"),
        fetch("/api/mutual-funds"),
      ]);
      const [holdingsData, fundsData] = await Promise.all([
        holdingsRes.json(),
        fundsRes.json(),
      ]);
      const holdings = holdingsData.holdings?.length || 0;
      const funds = fundsData.funds?.length || 0;
      setHasPortfolio(holdings > 0 || funds > 0);
      return holdings > 0 || funds > 0;
    } catch {
      return false;
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    const has = await checkPortfolio();
    if (!has) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/ai/portfolio-health", { method: "POST" });
      const data = await res.json();
      setAdvice(data.advice || "Unable to analyze portfolio right now.");
    } catch {
      setAdvice("Unable to analyze portfolio right now. Please try again later.");
    }
    setLoading(false);
  };

  if (hasPortfolio === false) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex justify-center gap-3 mb-4">
            <Briefcase className="h-10 w-10 text-blue-300" />
            <PiggyBank className="h-10 w-10 text-violet-300" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No portfolio to analyze yet</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Add some stock holdings or mutual funds first, then AI can analyze your
            entire portfolio and give you personalized advice on diversification,
            risk, and what to focus on next.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-violet-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">What does this do?</p>
              <p className="text-sm text-muted-foreground">
                AI looks at your complete portfolio — all your stocks, mutual funds,
                and trading history — to give you simple, personalized advice.
                It checks if your investments are well-spread, highlights any risks,
                and suggests what to do next.
              </p>
            </div>
          </div>

          {!advice && !loading && (
            <Button
              onClick={fetchInsights}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              Analyze My Portfolio
            </Button>
          )}

          {loading && (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                AI is analyzing your stocks, mutual funds, and trading patterns...
              </p>
            </div>
          )}

          {advice && !loading && (
            <div className="space-y-3">
              <div className="bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-medium text-violet-700 dark:text-violet-400">
                    AI Portfolio Analysis
                  </span>
                </div>
                <div className="whitespace-pre-line text-sm text-violet-900 dark:text-violet-200">
                  {advice}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInsights}
                className="text-xs"
              >
                <Brain className="h-3 w-3 mr-1" />
                Refresh Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
