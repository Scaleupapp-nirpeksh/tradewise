"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDefinition } from "@/lib/glossary";

interface HelpTipProps {
  term: string;
  /** Override the glossary definition with custom text */
  text?: string;
}

export function HelpTip({ term, text }: HelpTipProps) {
  const definition = text || getDefinition(term);
  if (!definition) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="inline h-3.5 w-3.5 text-muted-foreground cursor-help ml-1" />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-65 text-xs leading-relaxed"
        >
          <p className="font-medium mb-0.5">{term}</p>
          <p className="text-muted-foreground">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
