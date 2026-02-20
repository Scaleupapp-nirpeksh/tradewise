"use client";

import { useState, useEffect } from "react";
import { Target, Plus, Trash2, Trophy, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GoalTip } from "@/components/ai-buddy/goal-tip";

interface Goal {
  id: string;
  type: string;
  targetValue: number;
  currentValue: number;
  period: string;
  startDate: string;
  endDate: string;
  achieved: boolean;
}

const GOAL_TYPES: Record<string, { label: string; unit: string; description: string }> = {
  NET_PNL: {
    label: "Net P&L Target",
    unit: "₹",
    description: "Target profit amount from intraday trades for the period",
  },
  WIN_RATE: {
    label: "Win Rate Target",
    unit: "%",
    description: "Percentage of trades that should be profitable",
  },
  TOTAL_TRADES: {
    label: "Trade Count",
    unit: "trades",
    description: "Minimum number of trades to take",
  },
  MAX_LOSS_PER_TRADE: {
    label: "Max Loss Per Trade",
    unit: "₹",
    description: "Keep individual trade losses below this amount",
  },
  PORTFOLIO_VALUE: {
    label: "Portfolio Value Target",
    unit: "₹",
    description: "Grow your total portfolio (stocks + mutual funds) to this value",
  },
  MONTHLY_INVESTMENT: {
    label: "Monthly Investment Target",
    unit: "₹",
    description: "Invest at least this much every month in stocks or mutual funds",
  },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    type: "NET_PNL",
    targetValue: "",
    period: "WEEKLY",
  });

  const fetchGoals = () => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => {
        setGoals(data.goals || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAdd = async () => {
    setAdding(true);
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (form.period === "DAILY") {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else if (form.period === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    } else if (form.period === "MONTHLY") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else {
      // YEARLY
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
    }

    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        targetValue: parseFloat(form.targetValue),
        period: form.period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    setShowAdd(false);
    setForm({ type: "NET_PNL", targetValue: "", period: "WEEKLY" });
    setAdding(false);
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    fetchGoals();
  };

  const getProgress = (goal: Goal) => {
    if (goal.type === "MAX_LOSS_PER_TRADE") {
      return goal.currentValue <= goal.targetValue ? 100 : 0;
    }
    if (goal.targetValue <= 0) return 0;
    return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  };

  const getProgressColor = (pct: number, achieved: boolean) => {
    if (achieved) return "bg-emerald-500";
    if (pct >= 70) return "bg-emerald-400";
    if (pct >= 40) return "bg-amber-400";
    return "bg-red-400";
  };

  const formatValue = (goal: Goal, value: number) => {
    const type = GOAL_TYPES[goal.type];
    if (type.unit === "₹") return `₹${value.toFixed(0)}`;
    if (type.unit === "%") return `${value.toFixed(1)}%`;
    return `${value.toFixed(0)} ${type.unit}`;
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading goals...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-gray-600" />
            Goals
          </h1>
          <p className="text-muted-foreground text-sm">
            Set targets for your trading and investments, and track your progress
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Add Goal Form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GOAL_TYPES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {GOAL_TYPES[form.type]?.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={form.period}
                  onValueChange={(v) => setForm({ ...form, period: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                Target ({GOAL_TYPES[form.type]?.unit})
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 ml-1 inline text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {form.type === "NET_PNL" &&
                        "How much profit do you want to make?"}
                      {form.type === "WIN_RATE" &&
                        "What % of trades should be winners? 50-60% is a good start."}
                      {form.type === "TOTAL_TRADES" &&
                        "How many trades do you want to complete?"}
                      {form.type === "MAX_LOSS_PER_TRADE" &&
                        "What's the maximum you'll allow yourself to lose on any single trade?"}
                      {form.type === "PORTFOLIO_VALUE" &&
                        "What total value do you want your stocks + mutual funds to reach?"}
                      {form.type === "MONTHLY_INVESTMENT" &&
                        "How much do you want to invest every month in stocks or mutual funds?"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="number"
                placeholder={
                  form.type === "NET_PNL"
                    ? "5000"
                    : form.type === "WIN_RATE"
                    ? "55"
                    : form.type === "TOTAL_TRADES"
                    ? "20"
                    : "1000"
                }
                value={form.targetValue}
                onChange={(e) =>
                  setForm({ ...form, targetValue: e.target.value })
                }
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={adding || !form.targetValue}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {adding ? "Creating..." : "Create Goal"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No goals yet. Set a target to stay motivated!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const typeInfo = GOAL_TYPES[goal.type];

            return (
              <Card key={goal.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {goal.achieved && (
                        <Trophy className="h-4 w-4 text-emerald-500" />
                      )}
                      <p className="font-medium text-sm">
                        {typeInfo?.label || goal.type}
                      </p>
                      <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                        {goal.period}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(
                        progress,
                        goal.achieved
                      )}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Current: {formatValue(goal, goal.currentValue)}
                    </span>
                    <span>
                      Target: {formatValue(goal, goal.targetValue)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(goal.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    –{" "}
                    {new Date(goal.endDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <div className="mt-2">
                    <GoalTip
                      type={goal.type}
                      targetValue={goal.targetValue}
                      currentValue={goal.currentValue}
                      period={goal.period}
                      startDate={goal.startDate}
                      endDate={goal.endDate}
                      achieved={goal.achieved}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
