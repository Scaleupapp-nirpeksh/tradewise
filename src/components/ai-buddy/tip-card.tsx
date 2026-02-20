"use client";

import { useState } from "react";
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  X,
  ChevronDown,
} from "lucide-react";
import { BuddyTip, TipSeverity } from "@/lib/ai-buddy/tips";

const SEVERITY_ORDER: TipSeverity[] = ["danger", "warning", "info", "success"];

const STYLES: Record<TipSeverity, string> = {
  danger: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
};

const ICONS: Record<TipSeverity, typeof Lightbulb> = {
  danger: ShieldAlert,
  warning: AlertTriangle,
  info: Lightbulb,
  success: CheckCircle,
};

interface TipCardProps {
  tips: BuddyTip[];
  compact?: boolean;
  maxVisible?: number;
  className?: string;
}

export function TipCard({ tips, compact = false, maxVisible = 3, className = "" }: TipCardProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = sessionStorage.getItem("buddy-dismissed");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showAll, setShowAll] = useState(false);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      sessionStorage.setItem("buddy-dismissed", JSON.stringify([...next]));
    } catch {}
  };

  // Filter dismissed, sort by severity priority
  const visible = tips
    .filter((t) => !dismissed.has(t.id))
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  if (visible.length === 0) return null;

  const shown = showAll ? visible : visible.slice(0, maxVisible);
  const hiddenCount = visible.length - maxVisible;

  return (
    <div className={`space-y-2 ${className}`}>
      {shown.map((tip) => {
        const Icon = ICONS[tip.severity];
        return (
          <div
            key={tip.id}
            className={`flex items-start gap-2 rounded-lg border ${STYLES[tip.severity]} ${
              compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
            }`}
          >
            <Icon className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} mt-0.5 shrink-0`} />
            <p className="flex-1">{tip.message}</p>
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(tip.id); }}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
            </button>
          </div>
        );
      })}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-3 w-3" />
          {hiddenCount} more tip{hiddenCount > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
