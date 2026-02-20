"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MfSearchResult } from "@/types";

interface MfSearchProps {
  value: string;
  onChange: (fund: { schemeName: string; schemeCode: string }) => void;
  placeholder?: string;
  id?: string;
}

export function MfSearch({
  value,
  onChange,
  placeholder = "Search for a fund like 'Axis Bluechip', 'SBI Small Cap'...",
  id,
}: MfSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<MfSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const searchFunds = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/mf/search?q=${encodeURIComponent(q)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      // Silently fail
    }
    setSearching(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setHighlightIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 3) {
      debounceRef.current = setTimeout(() => searchFunds(val), 400);
    } else {
      setResults([]);
    }
  };

  const selectFund = (fund: MfSearchResult) => {
    setQuery(fund.schemeName);
    // AMFI API returns schemeCode as number, ensure it's always a string
    onChange({ schemeName: fund.schemeName, schemeCode: String(fund.schemeCode) });
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectFund(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="pl-9"
          autoComplete="off"
          required
        />
      </div>
      {isOpen && (results.length > 0 || searching) && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-lg border shadow-lg max-h-64 overflow-y-auto">
          {results.map((fund, idx) => (
            <button
              key={fund.schemeCode}
              type="button"
              className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                idx === highlightIndex ? "bg-accent" : ""
              }`}
              onClick={() => selectFund(fund)}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              <span className="text-sm">{fund.schemeName}</span>
            </button>
          ))}
          {searching && (
            <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching mutual funds...
            </div>
          )}
          {!searching && results.length === 0 && query.length >= 3 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No funds found. Try a different name.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
