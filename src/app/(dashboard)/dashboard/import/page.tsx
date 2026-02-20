"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  FileUp,
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Link2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ParsedTrade {
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedTrade[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    count: number;
  } | null>(null);
  const [error, setError] = useState("");

  // Groww sync state
  const [growwConnected, setGrowwConnected] = useState(false);
  const [syncing, setSyncing] = useState<"holdings" | "trades" | null>(null);
  const [syncResult, setSyncResult] = useState<{
    type: string;
    imported: number;
    skipped: number;
  } | null>(null);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.growwConnected) {
          setGrowwConnected(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleGrowwSync = async (type: "holdings" | "trades") => {
    setSyncing(type);
    setSyncResult(null);
    setSyncError("");
    try {
      const res = await fetch(`/api/broker/sync/${type}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncResult({
          type,
          imported: data.imported,
          skipped: data.skipped,
        });
      } else {
        setSyncError(data.error || `Failed to sync ${type}.`);
      }
    } catch {
      setSyncError(`Failed to sync ${type}.`);
    }
    setSyncing(null);
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setError("");
      setResult(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("preview", "true");

      try {
        const res = await fetch("/api/import/csv", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setPreview(data.trades || []);
        }
      } catch {
        setError("Failed to parse the CSV file.");
      }
    },
    []
  );

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import/csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult({ success: true, count: data.imported });
        setPreview([]);
        setFile(null);
      }
    } catch {
      setError("Failed to import trades.");
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileUp className="h-6 w-6 text-blue-600" />
          Import Trades
        </h1>
        <p className="text-muted-foreground text-sm">
          Bring your trades into TradeWise — sync from Groww or upload a CSV file.
        </p>
      </div>

      {/* Groww Sync - Primary */}
      <Card className={growwConnected ? "border-emerald-200 dark:border-emerald-900" : "border-violet-200 dark:border-violet-900"}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {growwConnected ? "Groww Connected" : "Connect Your Groww Account"}
          </CardTitle>
          {growwConnected ? (
            <p className="text-sm text-muted-foreground">
              Your Groww account is linked. Sync your trades and holdings with one click.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect Groww to automatically import your trades and holdings. No CSV needed!
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {growwConnected ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 h-14"
                  onClick={() => handleGrowwSync("trades")}
                  disabled={syncing !== null}
                >
                  {syncing === "trades" ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5 mr-2" />
                  )}
                  <div className="text-left">
                    <div>Sync My Trades</div>
                    <div className="text-xs font-normal opacity-80">Import trade history from Groww</div>
                  </div>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14"
                  onClick={() => handleGrowwSync("holdings")}
                  disabled={syncing !== null}
                >
                  {syncing === "holdings" ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5 mr-2" />
                  )}
                  <div className="text-left">
                    <div>Sync My Holdings</div>
                    <div className="text-xs font-normal text-muted-foreground">Import current positions</div>
                  </div>
                </Button>
              </div>
              {syncResult && (
                <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    Imported {syncResult.imported} {syncResult.type},{" "}
                    {syncResult.skipped} already existed.
                  </p>
                </div>
              )}
              {syncError && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{syncError}</p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">How to connect:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <Link href="/dashboard/settings" className="text-emerald-600 underline">Settings</Link> and find the Groww API section</li>
                  <li>Enter your Groww API Key and Secret</li>
                  <li>Click &quot;Connect&quot; to link your account</li>
                </ol>
              </div>
              <Link href="/dashboard/settings">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings to Connect Groww
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Upload - Secondary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload CSV File
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have Groww? You can also import trades via CSV from any broker.
          </p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Upload your broker tradebook CSV. We support Groww, Zerodha,
              Angel One, and generic CSV formats.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" asChild>
                <span>Choose CSV File</span>
              </Button>
            </label>
            {file && (
              <p className="text-sm text-emerald-600 mt-3">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="mt-4 bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">
              Expected CSV columns:
            </p>
            <p className="text-xs text-muted-foreground">
              symbol, side (BUY/SELL), quantity, entry_price, exit_price,
              entry_time
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Column names are flexible — we&apos;ll try to auto-detect them.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {result?.success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Successfully imported {result.count} trades! Check your trade list.
          </p>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Preview ({preview.length} trades found)
            </CardTitle>
            <Button
              onClick={handleImport}
              disabled={importing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {importing
                ? "Importing..."
                : `Import ${preview.length} Trades`}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(0, 20).map((trade, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          trade.side === "BUY"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        }
                      >
                        {trade.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{trade.entryPrice}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{trade.exitPrice}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {preview.length > 20 && (
              <p className="text-center text-sm text-muted-foreground py-3">
                ...and {preview.length - 20} more trades
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
