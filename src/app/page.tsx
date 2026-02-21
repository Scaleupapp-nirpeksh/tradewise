import Link from "next/link";
import {
  BarChart3,
  Brain,
  Briefcase,
  Calculator,
  Heart,
  IndianRupee,
  PiggyBank,
  Target,
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
          Built for Indian Investors
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
          Your Complete
          <br />
          Money Companion.
          <br />
          <span className="text-emerald-600">Trade. Invest. Grow.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
          Track intraday trades, manage your stock portfolio, monitor mutual
          funds — all in one place. With AI guidance and beginner-friendly
          explanations, managing money has never been this simple.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8"
            >
              Start Free — No Credit Card
            </Button>
          </Link>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-3">
          One Platform, Three Ways to Grow
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Whether you trade daily, hold stocks long-term, or invest in mutual
          funds — TradeWise has you covered.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PillarCard
            icon={<TrendingUp className="h-8 w-8 text-emerald-600" />}
            title="Intraday Trading"
            description="Track live P&L after all charges — STT, brokerage, GST. Get AI trade ideas, SMS loss alerts, and daily analytics."
            color="emerald"
          />
          <PillarCard
            icon={<Briefcase className="h-8 w-8 text-blue-600" />}
            title="Stock Holdings"
            description="Monitor your delivery stocks with live NSE/BSE prices. AI tells you what to Hold, Sell, or Buy More."
            color="blue"
          />
          <PillarCard
            icon={<PiggyBank className="h-8 w-8 text-violet-600" />}
            title="Mutual Funds"
            description="Track your SIPs and lumpsum investments. See NAVs, returns, and how your funds are spread across categories."
            color="violet"
          />
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-3">
            Everything You Need to Be Smarter with Money
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Powerful tools that are simple enough for anyone to use.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-8 w-8 text-violet-600" />}
              title="AI-Powered Insights"
              description="Portfolio health analysis, per-stock advice, and trade ideas — all powered by AI that explains things in plain language."
            />
            <FeatureCard
              icon={<IndianRupee className="h-8 w-8 text-emerald-600" />}
              title="True P&L After Charges"
              description="See your real profits after STT, GST, SEBI charges, stamp duty, and brokerage. No more guessing."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
              title="Smart Analytics"
              description="Win rate, asset allocation, top performers, MF category breakdown — understand your money at a glance."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8 text-amber-600" />}
              title="Goals & Tracking"
              description="Set portfolio value targets and monthly investment goals. Watch your progress bar fill up over time."
            />
            <FeatureCard
              icon={<Calculator className="h-8 w-8 text-teal-600" />}
              title="SIP & Investment Calculators"
              description="See how your money grows with the power of compounding. Plan your SIP or lumpsum investments."
            />
            <FeatureCard
              icon={<Heart className="h-8 w-8 text-rose-500" />}
              title="Beginner Friendly"
              description="No complex jargon. Tooltips explain every term. Guided entry for everything. Built for people starting out."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">
          Get Started in 3 Simple Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard
            number={1}
            title="Add Your Investments"
            description="Add your intraday trades, stock holdings, or mutual funds in seconds. No broker linking needed."
          />
          <StepCard
            number={2}
            title="See the Full Picture"
            description="Live prices, true P&L after charges, portfolio analytics, and net worth — all in one clean dashboard."
          />
          <StepCard
            number={3}
            title="Get AI Guidance"
            description="AI analyzes your portfolio and tells you what to hold, sell, or buy more — in simple language anyone can understand."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 text-white py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Your Finances, One Dashboard, Zero Jargon.
          </h2>
          <p className="text-emerald-100 text-lg mb-8">
            Whether you&apos;re a day trader or a long-term investor, TradeWise
            makes managing money simple.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>TradeWise — Smart Investing for Indian Markets</p>
        </div>
      </footer>
    </div>
  );
}

function PillarCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "emerald" | "blue" | "violet";
}) {
  const borderColors = {
    emerald: "border-t-emerald-500",
    blue: "border-t-blue-500",
    violet: "border-t-violet-500",
  };

  return (
    <div
      className={`bg-card border border-t-4 ${borderColors[color]} rounded-xl p-6 hover:shadow-lg transition-shadow`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
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
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
