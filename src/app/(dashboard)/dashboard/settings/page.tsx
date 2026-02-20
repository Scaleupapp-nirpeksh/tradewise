"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Bell,
  IndianRupee,
  Building2,
  User,
  Link2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BROKERS = [
  "Zerodha",
  "Groww",
  "Angel One",
  "Upstox",
  "ICICI Direct",
  "HDFC Securities",
  "Other",
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [growwConnected, setGrowwConnected] = useState(false);
  const [growwTokenExpired, setGrowwTokenExpired] = useState(false);
  const [growwApiKey, setGrowwApiKey] = useState("");
  const [growwApiSecret, setGrowwApiSecret] = useState("");
  const [connectingGroww, setConnectingGroww] = useState(false);
  const [growwMessage, setGrowwMessage] = useState("");
  const [syncing, setSyncing] = useState<"holdings" | "trades" | null>(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    capitalAmount: "",
    dailyLossLimit: "",
    brokerName: "Groww",
    smsAlertsEnabled: true,
    dailySummaryEnabled: true,
    morningAiEnabled: true,
    priceAlertThreshold: "1.0",
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setForm({
            name: data.user.name || "",
            phone: data.user.phone || "",
            capitalAmount: data.user.capitalAmount?.toString() || "100000",
            dailyLossLimit: data.user.dailyLossLimit?.toString() || "2000",
            brokerName: data.user.brokerName || "Groww",
            smsAlertsEnabled: data.user.smsAlertsEnabled ?? true,
            dailySummaryEnabled: data.user.dailySummaryEnabled ?? true,
            morningAiEnabled: data.user.morningAiEnabled ?? true,
            priceAlertThreshold:
              data.user.priceAlertThreshold?.toString() || "1.0",
          });
          setGrowwConnected(data.user.growwConnected ?? false);
          setGrowwTokenExpired(data.user.growwTokenExpired ?? false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleGrowwConnect = async () => {
    if (!growwApiKey.trim()) {
      setGrowwMessage("Please enter your Groww API Key.");
      return;
    }
    setConnectingGroww(true);
    setGrowwMessage("");
    try {
      const res = await fetch("/api/broker/groww/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: growwApiKey.trim(),
          apiSecret: growwApiSecret.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGrowwMessage("API credentials saved. Starting OAuth...");
        // Get the OAuth URL and redirect
        const authRes = await fetch("/api/broker/groww/auth");
        const authData = await authRes.json();
        if (authData.authUrl) {
          window.location.href = authData.authUrl;
          return;
        }
        setGrowwMessage("Credentials saved. Complete OAuth to finish setup.");
      } else {
        setGrowwMessage(data.error || "Failed to save credentials.");
      }
    } catch {
      setGrowwMessage("Connection failed. Check your credentials.");
    }
    setConnectingGroww(false);
  };

  const handleGrowwSync = async (type: "holdings" | "trades") => {
    setSyncing(type);
    setSyncMessage("");
    try {
      const res = await fetch(`/api/broker/sync/${type}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(
          `Synced ${data.imported} ${type}, ${data.skipped} already existed.`
        );
      } else {
        setSyncMessage(data.error || `Failed to sync ${type}.`);
      }
    } catch {
      setSyncMessage(`Failed to sync ${type}.`);
    }
    setSyncing(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          capitalAmount: parseFloat(form.capitalAmount),
          dailyLossLimit: parseFloat(form.dailyLossLimit),
          brokerName: form.brokerName,
          smsAlertsEnabled: form.smsAlertsEnabled,
          dailySummaryEnabled: form.dailySummaryEnabled,
          morningAiEnabled: form.morningAiEnabled,
          priceAlertThreshold: parseFloat(form.priceAlertThreshold),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Save error:", error);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-gray-600" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account, alerts, and broker configuration
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (used for login)</Label>
            <Input
              id="phone"
              value={form.phone}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              This is your login phone number and cannot be changed here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Capital & Risk */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Capital & Risk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="capital">Trading Capital (INR)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">
                ₹
              </span>
              <Input
                id="capital"
                type="number"
                className="pl-7"
                value={form.capitalAmount}
                onChange={(e) =>
                  setForm({ ...form, capitalAmount: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lossLimit">Daily Loss Limit (INR)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">
                ₹
              </span>
              <Input
                id="lossLimit"
                type="number"
                className="pl-7"
                value={form.dailyLossLimit}
                onChange={(e) =>
                  setForm({ ...form, dailyLossLimit: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;ll get an SMS alert if your daily losses exceed this
              amount.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Broker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Broker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Broker</Label>
            <Select
              value={form.brokerName}
              onValueChange={(v) => setForm({ ...form, brokerName: v })}
            >
              <SelectTrigger>
                <SelectValue />
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
              Changing your broker updates the charge calculation for future
              trades.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Groww Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Groww Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {growwConnected && !growwTokenExpired ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Connected to Groww</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGrowwSync("holdings")}
                  disabled={syncing !== null}
                >
                  {syncing === "holdings" ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Sync Holdings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGrowwSync("trades")}
                  disabled={syncing !== null}
                >
                  {syncing === "trades" ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Sync Trades
                </Button>
              </div>
              {syncMessage && (
                <p className="text-xs text-muted-foreground">{syncMessage}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {growwTokenExpired && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    Groww token expired. Re-connect below.
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Connect your Groww Trading API account to auto-import trades and
                get live prices. Requires the Groww Trading API subscription
                (₹499/month).
              </p>
              <div className="space-y-2">
                <Label htmlFor="growwKey">API Key</Label>
                <Input
                  id="growwKey"
                  placeholder="Your Groww API Key"
                  value={growwApiKey}
                  onChange={(e) => setGrowwApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="growwSecret">API Secret</Label>
                <Input
                  id="growwSecret"
                  type="password"
                  placeholder="Your Groww API Secret"
                  value={growwApiSecret}
                  onChange={(e) => setGrowwApiSecret(e.target.value)}
                />
              </div>
              <Button
                onClick={handleGrowwConnect}
                disabled={connectingGroww}
                className="w-full"
                variant="outline"
              >
                {connectingGroww ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                {connectingGroww ? "Connecting..." : "Connect Groww"}
              </Button>
              {growwMessage && (
                <p className="text-xs text-muted-foreground">{growwMessage}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Loss Alerts</p>
                <p className="text-muted-foreground text-xs">
                  SMS alert when daily losses exceed your limit
                </p>
              </div>
              <Switch
                checked={form.smsAlertsEnabled}
                onCheckedChange={(v) =>
                  setForm({ ...form, smsAlertsEnabled: v })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="font-medium">Daily Summary</p>
                <p className="text-muted-foreground text-xs">
                  End-of-day P&L summary at 3:45 PM
                </p>
              </div>
              <Switch
                checked={form.dailySummaryEnabled}
                onCheckedChange={(v) =>
                  setForm({ ...form, dailySummaryEnabled: v })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="font-medium">AI Suggestions</p>
                <p className="text-muted-foreground text-xs">
                  Morning trade ideas at 9:00 AM
                </p>
              </div>
              <Switch
                checked={form.morningAiEnabled}
                onCheckedChange={(v) =>
                  setForm({ ...form, morningAiEnabled: v })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="font-medium">Price Alert Threshold</p>
                <p className="text-muted-foreground text-xs">
                  Get alerted when price is within this % of your target/stop-loss
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="5"
                  className="w-20 h-8 text-sm"
                  value={form.priceAlertThreshold}
                  onChange={(e) =>
                    setForm({ ...form, priceAlertThreshold: e.target.value })
                  }
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </Button>
    </div>
  );
}
