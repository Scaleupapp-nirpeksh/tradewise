"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  PiggyBank,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MutualFundWithLive } from "@/types";
import { RedeemFundDialog } from "@/components/shared/redeem-fund-dialog";
import { MfTips } from "@/components/ai-buddy/mf-tips";

const CATEGORY_COLORS: Record<string, string> = {
  Equity: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Debt: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Hybrid: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  "ELSS (Tax Saver)": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  "Index Fund": "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
  Liquid: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export default function MutualFundsPage() {
  const [funds, setFunds] = useState<MutualFundWithLive[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalCurrentValue, setTotalCurrentValue] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [activeSips, setActiveSips] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [redeemingFund, setRedeemingFund] =
    useState<MutualFundWithLive | null>(null);

  const fetchFunds = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch("/api/mutual-funds");
      const data = await res.json();
      setFunds(data.funds || []);
      setTotalInvested(data.totalInvested || 0);
      setTotalCurrentValue(data.totalCurrentValue || 0);
      setTotalReturns(data.totalReturns || 0);
      setActiveSips(data.activeSips || 0);
    } catch (error) {
      console.error("Failed to fetch funds:", error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-violet-600" />
            My Mutual Funds
          </h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading your mutual funds...
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalReturnsPct =
    totalInvested > 0
      ? Math.round((totalReturns / totalInvested) * 10000) / 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-violet-600" />
            My Mutual Funds
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mutual funds pool money from many investors to buy stocks or bonds.
            They&apos;re managed by professionals, so you don&apos;t need to
            pick individual stocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/mutual-funds/add">
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Fund
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => fetchFunds(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {funds.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <PiggyBank className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No mutual funds yet</p>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Mutual funds are a great way to invest if you don&apos;t want to
              pick stocks yourself. Professionals manage your money for you.
            </p>
            <Link href="/dashboard/mutual-funds/add">
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Fund
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {funds.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Invested</p>
                <p className="text-xl font-bold">{formatINR(totalInvested)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Current Value</p>
                <p className="text-xl font-bold">
                  {formatINR(totalCurrentValue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Returns</p>
                <p
                  className={`text-xl font-bold ${totalReturns >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {totalReturns >= 0 ? "+" : ""}
                  {formatINR(totalReturns)}
                  <span className="text-sm ml-1">
                    ({totalReturnsPct >= 0 ? "+" : ""}
                    {totalReturnsPct}%)
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Active SIPs</p>
                <p className="text-xl font-bold">{activeSips}</p>
                <p className="text-xs text-muted-foreground">
                  {funds.length} fund{funds.length !== 1 ? "s" : ""} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fund Cards */}
          <div className="space-y-3">
            {funds.map((fund) => {
              const isExpanded = expandedId === fund.id;
              const categoryColor =
                CATEGORY_COLORS[fund.category || ""] ||
                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";

              return (
                <Card key={fund.id}>
                  <CardContent className="p-4">
                    <div
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : fund.id)
                      }
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Name + Category */}
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              fund.unrealizedPnl >= 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {fund.unrealizedPnl >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm leading-tight">
                                {fund.schemeName}
                              </p>
                              {fund.category && (
                                <Badge
                                  className={`text-[10px] py-0 ${categoryColor}`}
                                >
                                  {fund.category}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Invested {formatINR(fund.investedAmount)} →
                              Current {formatINR(fund.currentValue)}
                              {fund.isSip && fund.sipAmount && (
                                <span className="ml-2">
                                  · SIP: {formatINR(fund.sipAmount)}/mo
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Right: Returns */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                fund.unrealizedPnl >= 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {fund.unrealizedPnl >= 0 ? "+" : ""}
                              {formatINR(fund.unrealizedPnl)}
                              <span className="text-xs ml-1">
                                ({fund.unrealizedPnlPct >= 0 ? "+" : ""}
                                {fund.unrealizedPnlPct}%)
                              </span>
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Units
                            </p>
                            <p className="font-medium">
                              {fund.units.toFixed(3)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Current NAV
                            </p>
                            <p className="font-medium">
                              ₹{fund.currentNav.toFixed(4)}
                            </p>
                          </div>
                          {fund.folioNumber && (
                            <div>
                              <p className="text-muted-foreground text-xs">
                                Folio
                              </p>
                              <p className="font-medium">
                                {fund.folioNumber}
                              </p>
                            </div>
                          )}
                          {fund.isSip && fund.sipDate && (
                            <div>
                              <p className="text-muted-foreground text-xs">
                                SIP Date
                              </p>
                              <p className="font-medium flex items-center gap-1">
                                <CalendarClock className="h-3 w-3" />
                                {fund.sipDate}th of every month
                              </p>
                            </div>
                          )}
                        </div>
                        {fund.notes && (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                            {fund.notes}
                          </p>
                        )}
                        <MfTips
                          unrealizedPnlPct={fund.unrealizedPnlPct}
                          category={fund.category ?? null}
                          isSip={fund.isSip}
                          createdAt={fund.createdAt}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRedeemingFund(fund);
                            }}
                          >
                            Redeem
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Redeem Dialog */}
      {redeemingFund && (
        <RedeemFundDialog
          fund={redeemingFund}
          open={!!redeemingFund}
          onOpenChange={(open) => {
            if (!open) setRedeemingFund(null);
          }}
          onRedeemed={() => {
            setRedeemingFund(null);
            fetchFunds(true);
          }}
        />
      )}
    </div>
  );
}
