"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/charges";
import { SuggestionQuestionnaire, SuggestionPreferences } from "@/components/ai-buddy/suggestion-questionnaire";

interface Suggestion {
  id: string;
  symbol: string;
  action: string;
  suggestedEntry: number;
  suggestedTarget: number;
  suggestedStopLoss: number;
  reasoning: string;
  confidence: string;
  status: string;
  createdAt: string;
}

const COOLDOWN_KEY = "suggestions-last-generated";
const COOLDOWN_MS = 5 * 60 * 1000;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getRR(entry: number, target: number, sl: number): number {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(target - entry);
  return risk > 0 ? Math.round((reward / risk) * 10) / 10 : 0;
}

function rrColor(rr: number): string {
  if (rr >= 2) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  if (rr >= 1) return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
}

const confidenceColor = (c: string) =>
  ({
    HIGH: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  })[c] || "bg-gray-100 text-gray-600";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "FOLLOWED":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Followed
        </Badge>
      );
    case "IGNORED":
      return (
        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <XCircle className="h-3 w-3 mr-1" />
          Ignored
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge className="bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
          <Timer className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

export default function SuggestionsPage() {
  const router = useRouter();
  const [active, setActive] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number>(0);
  const [cooldownLeft, setCooldownLeft] = useState("");
  const [tab, setTab] = useState("active");

  // Questionnaire state
  const [prefs, setPrefs] = useState<SuggestionPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        fetch("/api/ai/suggestions?status=PENDING"),
        fetch("/api/ai/suggestions?status=FOLLOWED,IGNORED,EXPIRED"),
      ]);
      const [activeData, historyData] = await Promise.all([
        activeRes.json(),
        historyRes.json(),
      ]);
      setActive(activeData.suggestions || []);
      setHistory(historyData.suggestions || []);
    } catch {
      // Silently handle fetch errors
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSuggestions();
    // Load preferences
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((data) => {
        setPrefs(data.preferences || null);
        setPrefsLoading(false);
      })
      .catch(() => setPrefsLoading(false));
    // Check for existing cooldown
    try {
      const stored = sessionStorage.getItem(COOLDOWN_KEY);
      if (stored) {
        const end = parseInt(stored) + COOLDOWN_MS;
        if (end > Date.now()) setCooldownEnd(end);
      }
    } catch {}
  }, [fetchSuggestions]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownEnd <= Date.now()) {
      setCooldownLeft("");
      return;
    }
    const tick = () => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        setCooldownLeft("");
        setCooldownEnd(0);
        return;
      }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCooldownLeft(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/suggest", { method: "POST" });
      if (res.status === 429) {
        const data = await res.json();
        const end = Date.now() + (data.retryAfter || 300) * 1000;
        setCooldownEnd(end);
        try {
          sessionStorage.setItem(COOLDOWN_KEY, Date.now().toString());
        } catch {}
      } else if (res.ok) {
        const now = Date.now();
        setCooldownEnd(now + COOLDOWN_MS);
        try {
          sessionStorage.setItem(COOLDOWN_KEY, now.toString());
        } catch {}
        await fetchSuggestions();
      }
    } catch (error) {
      console.error("Failed to generate:", error);
    }
    setGenerating(false);
  };

  const updateStatus = async (id: string, status: "FOLLOWED" | "IGNORED") => {
    await fetch(`/api/ai/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchSuggestions();
  };

  const handleTakeTrade = async (s: Suggestion) => {
    await updateStatus(s.id, "FOLLOWED");
    const params = new URLSearchParams({
      symbol: s.symbol,
      side: s.action,
      entry: s.suggestedEntry.toString(),
      target: s.suggestedTarget.toString(),
      sl: s.suggestedStopLoss.toString(),
      suggestionId: s.id,
    });
    router.push(`/dashboard/trades/new?${params.toString()}`);
  };

  const handlePrefsComplete = (newPrefs: SuggestionPreferences) => {
    setPrefs(newPrefs);
    setShowQuestionnaire(false);
  };

  const isCooldown = cooldownEnd > Date.now();

  // Show questionnaire on first visit (no prefs set)
  if (!prefsLoading && !prefs && !showQuestionnaire) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-violet-600" />
            AI Suggestions
          </h1>
          <p className="text-muted-foreground text-sm">
            Let&apos;s personalize your experience first. Answer a few quick questions.
          </p>
        </div>
        <SuggestionQuestionnaire onComplete={handlePrefsComplete} />
      </div>
    );
  }

  if (showQuestionnaire) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-violet-600" />
              Update Preferences
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowQuestionnaire(false)}>
            Cancel
          </Button>
        </div>
        <SuggestionQuestionnaire onComplete={handlePrefsComplete} initialPrefs={prefs} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-violet-600" />
            AI Suggestions
          </h1>
          <p className="text-muted-foreground text-sm">
            Trade ideas powered by AI analysis of market data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuestionnaire(true)}
            className="text-xs"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1" />
            Preferences
          </Button>
          {isCooldown && cooldownLeft && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Next ideas in {cooldownLeft}
            </span>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generating || isCooldown}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`}
            />
            {generating ? "Analyzing..." : "Get New Ideas"}
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
        <p className="text-xs text-amber-800 dark:text-amber-400">
          <strong>Disclaimer:</strong> AI-generated ideas, not financial advice.
          Always verify with your own analysis.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active{active.length > 0 ? ` (${active.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading suggestions...
            </div>
          ) : active.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-violet-300 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  No active suggestions
                </h3>
                <p className="text-muted-foreground mb-4">
                  Click &quot;Get New Ideas&quot; to generate AI-powered trade
                  ideas based on current market conditions.
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={generating || isCooldown}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {generating ? "Analyzing market..." : "Generate Suggestions"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {active.map((s) => {
                const rr = getRR(
                  s.suggestedEntry,
                  s.suggestedTarget,
                  s.suggestedStopLoss
                );
                const risk = Math.abs(s.suggestedEntry - s.suggestedStopLoss);
                const reward = Math.abs(s.suggestedTarget - s.suggestedEntry);

                return (
                  <Card key={s.id} className="border-violet-100 dark:border-violet-900">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {s.action === "BUY" ? (
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                          <CardTitle className="text-lg">
                            {s.symbol}
                          </CardTitle>
                          <Badge
                            className={
                              s.action === "BUY"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                            }
                          >
                            {s.action}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={rrColor(rr)}>R/R 1:{rr}</Badge>
                          <Badge className={confidenceColor(s.confidence)}>
                            {s.confidence}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">Entry</p>
                          <p className="font-bold text-sm">
                            {formatINR(s.suggestedEntry)}
                          </p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/50 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">
                            Target
                          </p>
                          <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                            {formatINR(s.suggestedTarget)}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-500">
                            +{formatINR(reward)}/share
                          </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/50 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">
                            Stop Loss
                          </p>
                          <p className="font-bold text-sm text-red-700 dark:text-red-400">
                            {formatINR(s.suggestedStopLoss)}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-500">
                            -{formatINR(risk)}/share
                          </p>
                        </div>
                      </div>

                      <div className="bg-violet-50 dark:bg-violet-950/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-1">
                          Why this trade?
                        </p>
                        <p className="text-sm text-violet-900 dark:text-violet-300">{s.reasoning}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(s.createdAt)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground"
                            onClick={() => updateStatus(s.id, "IGNORED")}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Ignore
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleTakeTrade(s)}
                          >
                            Take this trade
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No past suggestions yet. They&apos;ll appear here after you
                follow, ignore, or they expire.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stock</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="text-right">Entry</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.symbol}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              s.action === "BUY"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                            }
                          >
                            {s.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatINR(s.suggestedEntry)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatINR(s.suggestedTarget)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatINR(s.suggestedStopLoss)}
                        </TableCell>
                        <TableCell>
                          <Badge className={confidenceColor(s.confidence)}>
                            {s.confidence}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
