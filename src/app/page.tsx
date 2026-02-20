import Link from "next/link";
import {
  BarChart3,
  Bell,
  Brain,
  IndianRupee,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white dark:from-background dark:to-background">
      {/* Navbar */}
      <nav className="border-b bg-white/80 dark:bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold">TradeWise</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <IndianRupee className="h-4 w-4" />
          Built for Indian Stock Markets
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
          Track Your Trades.
          <br />
          <span className="text-emerald-600">Grow Your Profits.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
          The simplest way to track intraday trades on NSE/BSE. Get AI-powered
          suggestions, SMS alerts when you&apos;re losing money, and see
          exactly where your profits go after charges.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8"
            >
              Start Tracking Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">
          Everything a Trader Needs
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<IndianRupee className="h-8 w-8 text-emerald-600" />}
            title="Accurate P&L"
            description="See your real profit after STT, GST, SEBI charges, stamp duty, and brokerage. No more guessing."
          />
          <FeatureCard
            icon={<Brain className="h-8 w-8 text-violet-600" />}
            title="AI Suggestions"
            description="Get simple trade ideas every morning with entry, target, and stop-loss levels explained in plain English."
          />
          <FeatureCard
            icon={<Bell className="h-8 w-8 text-amber-600" />}
            title="SMS Alerts"
            description="Get notified via SMS when your positions are losing money. Never miss a stop-loss again."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
            title="Smart Analytics"
            description="See your win rate, best strategies, worst mistakes, and how you're improving over time."
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-red-600" />}
            title="Risk Management"
            description="Set daily loss limits, track your risk per trade, and stay disciplined with built-in guardrails."
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8 text-emerald-600" />}
            title="Beginner Friendly"
            description="No complex jargon. Tooltips explain every term. Guided trade entry. Built for people starting out."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 text-white py-16 mt-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Stop Guessing. Start Tracking.
          </h2>
          <p className="text-emerald-100 text-lg mb-8">
            Most traders don&apos;t know their real P&L after charges. Be smarter
            than that.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8"
            >
              Start Trading
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>TradeWise — Smart Intraday Trading for Indian Stocks</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
