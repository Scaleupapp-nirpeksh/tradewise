import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/charges";

interface Suggestion {
  id: string;
  symbol: string;
  action: string;
  suggestedEntry: number;
  suggestedTarget: number;
  suggestedStopLoss: number;
  reasoning: string;
  confidence: string;
}

export function AiSuggestionCard({
  suggestion,
}: {
  suggestion: Suggestion | null;
}) {
  if (!suggestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground text-sm">
            No suggestions right now. Check back during market hours!
          </p>
          <Link href="/dashboard/suggestions">
            <Button variant="outline" size="sm" className="mt-3">
              View All Suggestions
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const confidenceColor = {
    HIGH: "bg-emerald-100 text-emerald-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-gray-100 text-gray-700",
  }[suggestion.confidence] || "bg-gray-100 text-gray-700";

  return (
    <Card className="border-violet-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600" />
            AI Suggestion
          </CardTitle>
          <Badge className={confidenceColor}>{suggestion.confidence}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            className={
              suggestion.action === "BUY"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }
          >
            {suggestion.action}
          </Badge>
          <span className="font-bold text-lg">{suggestion.symbol}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-muted-foreground text-xs">Entry</p>
            <p className="font-semibold">{formatINR(suggestion.suggestedEntry)}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2 text-center">
            <p className="text-muted-foreground text-xs">Target</p>
            <p className="font-semibold text-emerald-700">
              {formatINR(suggestion.suggestedTarget)}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-muted-foreground text-xs">Stop Loss</p>
            <p className="font-semibold text-red-700">
              {formatINR(suggestion.suggestedStopLoss)}
            </p>
          </div>
        </div>

        <div className="bg-violet-50 rounded-lg p-3">
          <p className="text-xs font-medium text-violet-700 mb-1">
            Why this trade?
          </p>
          <p className="text-sm text-violet-900">{suggestion.reasoning}</p>
        </div>

        <Link href="/dashboard/suggestions">
          <Button variant="outline" size="sm" className="w-full">
            See All Suggestions <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
