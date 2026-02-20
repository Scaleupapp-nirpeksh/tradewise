"use client";

import { useState } from "react";
import { Brain, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SuggestionPreferences {
  experience: string;
  riskAppetite: string;
  sectors: string[];
  tradeStyle: string;
}

const QUESTIONS = [
  {
    key: "experience",
    title: "How long have you been trading?",
    subtitle: "This helps us adjust the complexity of suggestions.",
    options: [
      { value: "beginner", label: "Just starting out" },
      { value: "few_months", label: "A few months" },
      { value: "one_year", label: "1+ years" },
      { value: "experienced", label: "I'm experienced" },
    ],
  },
  {
    key: "riskAppetite",
    title: "How much are you okay losing in a single trade?",
    subtitle: "We'll tailor suggestions to your comfort level.",
    options: [
      { value: "low", label: "Very little (₹200-500)" },
      { value: "moderate", label: "Moderate (₹500-1000)" },
      { value: "high", label: "I can handle ₹1000+" },
    ],
  },
  {
    key: "sectors",
    title: "Which sectors interest you?",
    subtitle: "Pick as many as you like. We'll focus suggestions here.",
    multi: true,
    options: [
      { value: "IT", label: "IT" },
      { value: "Banking", label: "Banking" },
      { value: "Pharma", label: "Pharma" },
      { value: "Auto", label: "Auto" },
      { value: "FMCG", label: "FMCG" },
      { value: "Energy", label: "Energy" },
      { value: "Metals", label: "Metals" },
      { value: "surprise", label: "Surprise me!" },
    ],
  },
  {
    key: "tradeStyle",
    title: "How do you prefer to trade?",
    subtitle: "This affects the kind of trades we suggest.",
    options: [
      { value: "scalping", label: "Quick in-and-out (minutes)" },
      { value: "intraday", label: "Hold for a few hours" },
      { value: "unsure", label: "Not sure yet" },
    ],
  },
];

interface Props {
  onComplete: (prefs: SuggestionPreferences) => void;
  initialPrefs?: SuggestionPreferences | null;
}

export function SuggestionQuestionnaire({ onComplete, initialPrefs }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => {
    if (initialPrefs) {
      return {
        experience: initialPrefs.experience,
        riskAppetite: initialPrefs.riskAppetite,
        sectors: initialPrefs.sectors,
        tradeStyle: initialPrefs.tradeStyle,
      };
    }
    return { experience: "", riskAppetite: "", sectors: [], tradeStyle: "" };
  });
  const [saving, setSaving] = useState(false);

  const q = QUESTIONS[step];
  const isMulti = "multi" in q && q.multi;
  const currentAnswer = answers[q.key];
  const canProceed = isMulti
    ? (currentAnswer as string[]).length > 0
    : !!currentAnswer;

  const handleSelect = (value: string) => {
    if (isMulti) {
      const current = (answers[q.key] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [q.key]: updated });
    } else {
      setAnswers({ ...answers, [q.key]: value });
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const prefs: SuggestionPreferences = {
      experience: answers.experience as string,
      riskAppetite: answers.riskAppetite as string,
      sectors: answers.sectors as string[],
      tradeStyle: answers.tradeStyle as string,
    };

    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionPreferences: prefs }),
      });
    } catch {
      // Still proceed — prefs will be passed directly
    }

    setSaving(false);
    onComplete(prefs);
  };

  return (
    <Card className="border-violet-200 dark:border-violet-900">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="h-6 w-6 text-violet-600" />
          <CardTitle className="text-lg">Personalize Your Suggestions</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Quick {QUESTIONS.length} questions to tailor AI suggestions just for you.
        </p>
        {/* Progress */}
        <div className="flex justify-center gap-1.5 mt-3">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-8 bg-violet-600"
                  : i < step
                    ? "w-4 bg-violet-400"
                    : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-base mb-1">{q.title}</h3>
          <p className="text-sm text-muted-foreground">{q.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {q.options.map((opt) => {
            const isSelected = isMulti
              ? (currentAnswer as string[]).includes(opt.value)
              : currentAnswer === opt.value;
            return (
              <Badge
                key={opt.value}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 text-sm ${
                  isSelected
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "hover:bg-accent"
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {isSelected && <Check className="h-3 w-3 mr-1" />}
                {opt.label}
              </Badge>
            );
          })}
        </div>

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step < QUESTIONS.length - 1 ? (
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handleFinish}
              disabled={!canProceed || saving}
            >
              {saving ? "Saving..." : "Get Suggestions!"}
              <Brain className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
