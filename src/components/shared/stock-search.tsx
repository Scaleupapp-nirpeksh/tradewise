"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface StockResult {
  symbol: string;
  name: string;
  exchange: string;
}

// Popular NSE stocks for instant local matching
const POPULAR_STOCKS: StockResult[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", exchange: "NSE" },
  { symbol: "ITC", name: "ITC Limited", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", exchange: "NSE" },
  { symbol: "LT", name: "Larsen & Toubro", exchange: "NSE" },
  { symbol: "AXISBANK", name: "Axis Bank", exchange: "NSE" },
  { symbol: "WIPRO", name: "Wipro", exchange: "NSE" },
  { symbol: "TATAMOTORS", name: "Tata Motors", exchange: "NSE" },
  { symbol: "SUNPHARMA", name: "Sun Pharma", exchange: "NSE" },
  { symbol: "MARUTI", name: "Maruti Suzuki", exchange: "NSE" },
  { symbol: "ONGC", name: "ONGC", exchange: "NSE" },
  { symbol: "NTPC", name: "NTPC", exchange: "NSE" },
  { symbol: "TATASTEEL", name: "Tata Steel", exchange: "NSE" },
  { symbol: "POWERGRID", name: "Power Grid Corp", exchange: "NSE" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", exchange: "NSE" },
  { symbol: "HCLTECH", name: "HCL Technologies", exchange: "NSE" },
  { symbol: "ADANIENT", name: "Adani Enterprises", exchange: "NSE" },
  { symbol: "ADANIPORTS", name: "Adani Ports", exchange: "NSE" },
  { symbol: "ASIANPAINT", name: "Asian Paints", exchange: "NSE" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", exchange: "NSE" },
  { symbol: "TITAN", name: "Titan Company", exchange: "NSE" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", exchange: "NSE" },
  { symbol: "NESTLEIND", name: "Nestle India", exchange: "NSE" },
  { symbol: "TECHM", name: "Tech Mahindra", exchange: "NSE" },
  { symbol: "M&M", name: "Mahindra & Mahindra", exchange: "NSE" },
  { symbol: "JSWSTEEL", name: "JSW Steel", exchange: "NSE" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", exchange: "NSE" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories", exchange: "NSE" },
  { symbol: "CIPLA", name: "Cipla", exchange: "NSE" },
  { symbol: "EICHERMOT", name: "Eicher Motors", exchange: "NSE" },
  { symbol: "COALINDIA", name: "Coal India", exchange: "NSE" },
  { symbol: "BPCL", name: "BPCL", exchange: "NSE" },
  { symbol: "GRASIM", name: "Grasim Industries", exchange: "NSE" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", exchange: "NSE" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", exchange: "NSE" },
  { symbol: "BRITANNIA", name: "Britannia Industries", exchange: "NSE" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", exchange: "NSE" },
  { symbol: "SBILIFE", name: "SBI Life Insurance", exchange: "NSE" },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance", exchange: "NSE" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products", exchange: "NSE" },
  { symbol: "HINDALCO", name: "Hindalco Industries", exchange: "NSE" },
  { symbol: "VEDL", name: "Vedanta", exchange: "NSE" },
  { symbol: "ZOMATO", name: "Zomato", exchange: "NSE" },
  { symbol: "PAYTM", name: "One 97 Communications (Paytm)", exchange: "NSE" },
];

const LOCAL_SYMBOLS = new Set(POPULAR_STOCKS.map((s) => s.symbol));

interface StockSearchProps {
  value: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
  id?: string;
}

export function StockSearch({ value, onChange, placeholder = "Type a stock name like Reliance, TCS...", id }: StockSearchProps) {
  const [query, setQuery] = useState(value);
  const [localResults, setLocalResults] = useState<StockResult[]>([]);
  const [apiResults, setApiResults] = useState<StockResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filterLocal = useCallback((q: string): StockResult[] => {
    if (!q) return POPULAR_STOCKS.slice(0, 8);
    const upper = q.toUpperCase();
    return POPULAR_STOCKS.filter(
      (s) =>
        s.symbol.includes(upper) ||
        s.name.toUpperCase().includes(upper)
    ).slice(0, 8);
  }, []);

  const searchAPI = useCallback(async (q: string) => {
    if (q.length < 2) {
      setApiResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out stocks already in local results, dedup by symbol
        const seen = new Set<string>();
        const filtered = (data.results || []).filter(
          (r: StockResult) => {
            if (LOCAL_SYMBOLS.has(r.symbol) || seen.has(r.symbol)) return false;
            seen.add(r.symbol);
            return true;
          }
        );
        setApiResults(filtered.slice(0, 8));
      }
    } catch {
      // Silently fail — local results still work
    }
    setSearching(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setQuery(val);
    onChange(val);

    const local = filterLocal(val);
    setLocalResults(local);
    setIsOpen(true);
    setHighlightIndex(-1);

    // Debounced API search when local results are few
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 2 && local.length < 3) {
      debounceRef.current = setTimeout(() => searchAPI(val), 500);
    } else {
      setApiResults([]);
    }
  };

  const handleFocus = () => {
    setLocalResults(filterLocal(query));
    setIsOpen(true);
    setHighlightIndex(-1);
  };

  const selectStock = (stock: StockResult) => {
    setQuery(stock.symbol);
    onChange(stock.symbol);
    setIsOpen(false);
  };

  const allResults = [...localResults, ...apiResults];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || allResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectStock(allResults[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={id}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="pl-9"
          autoComplete="off"
          required
        />
      </div>
      {isOpen && (localResults.length > 0 || apiResults.length > 0 || searching) && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-lg border shadow-lg max-h-64 overflow-y-auto">
          {localResults.map((stock, idx) => (
            <button
              key={stock.symbol}
              type="button"
              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-accent transition-colors ${
                idx === highlightIndex ? "bg-accent" : ""
              }`}
              onClick={() => selectStock(stock)}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              <div>
                <span className="font-medium text-sm">{stock.symbol}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {stock.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{stock.exchange}</span>
            </button>
          ))}

          {/* API results divider */}
          {apiResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border-t">
                More results from NSE
              </div>
              {apiResults.map((stock, idx) => (
                <button
                  key={`api-${stock.symbol}`}
                  type="button"
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-accent transition-colors ${
                    idx + localResults.length === highlightIndex ? "bg-accent" : ""
                  }`}
                  onClick={() => selectStock(stock)}
                  onMouseEnter={() => setHighlightIndex(idx + localResults.length)}
                >
                  <div>
                    <span className="font-medium text-sm">{stock.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {stock.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{stock.exchange}</span>
                </button>
              ))}
            </>
          )}

          {/* Loading indicator */}
          {searching && (
            <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2 border-t">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching more stocks...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
