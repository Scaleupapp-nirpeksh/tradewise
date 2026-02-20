"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  User,
  IndianRupee,
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
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

const STEPS = [
  { icon: User, title: "About You", description: "Let's get to know you" },
  {
    icon: IndianRupee,
    title: "Your Capital",
    description: "How much are you trading with?",
  },
  {
    icon: Building2,
    title: "Your Broker",
    description: "Which broker do you use?",
  },
];

const BROKERS = [
  "Zerodha",
  "Groww",
  "Angel One",
  "Upstox",
  "ICICI Direct",
  "HDFC Securities",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    capitalAmount: "100000",
    dailyLossLimit: "2000",
    brokerName: "Groww",
  });

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          capitalAmount: parseFloat(form.capitalAmount),
          dailyLossLimit: parseFloat(form.dailyLossLimit),
          brokerName: form.brokerName,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Onboarding error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">TradeWise</span>
          </div>
          <CardTitle className="text-xl">{STEPS[step].title}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {STEPS[step].description}
          </p>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step
                    ? "w-8 bg-emerald-600"
                    : i < step
                      ? "w-2 bg-emerald-400"
                      : "w-2 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">What should we call you?</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="capital">Starting Capital (in INR)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="capital"
                    type="number"
                    className="pl-7"
                    placeholder="100000"
                    value={form.capitalAmount}
                    onChange={(e) =>
                      setForm({ ...form, capitalAmount: e.target.value })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This is how much money you&apos;re using for intraday trading.
                  You can change this later.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lossLimit">
                  Daily Loss Limit (in INR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="lossLimit"
                    type="number"
                    className="pl-7"
                    placeholder="2000"
                    value={form.dailyLossLimit}
                    onChange={(e) =>
                      setForm({ ...form, dailyLossLimit: e.target.value })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll alert you via SMS if your losses cross this
                  amount in a day. Helps you stay disciplined!
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Which broker do you use?</Label>
                <Select
                  value={form.brokerName}
                  onValueChange={(v) =>
                    setForm({ ...form, brokerName: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {BROKERS.map((broker) => (
                      <SelectItem key={broker} value={broker}>
                        {broker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This helps us calculate accurate charges (brokerage, STT,
                  GST, etc.) for your trades.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-emerald-800 text-sm mb-2">
                  You&apos;re all set! Here&apos;s what you get:
                </h4>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> Accurate P&L after all charges
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> SMS alerts when losing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> AI-powered trade suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> Analytics to improve your trading
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setStep(step + 1)}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? "Setting up..." : "Start Trading!"}
                <TrendingUp className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
