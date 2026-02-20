import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DailyPnlCard } from "@/components/dashboard/daily-pnl-card";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { AiSuggestionCard } from "@/components/dashboard/ai-suggestion-card";
import { OpenPositions } from "@/components/dashboard/open-positions";
import { GettingStarted } from "@/components/guidance/getting-started";
import { NextAction } from "@/components/guidance/next-action";
import { GoalProgressSummary } from "@/components/dashboard/goal-progress-summary";
import { DailyTip } from "@/components/ai-buddy/daily-tip";
import { NetWorthCard } from "@/components/dashboard/net-worth-card";
import { LiveHoldings } from "@/components/dashboard/live-holdings";
import { MfSnapshot } from "@/components/dashboard/mf-snapshot";
import { PortfolioHealthCard } from "@/components/dashboard/portfolio-health-card";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      onboardingComplete: true,
      capitalAmount: true,
      dailyLossLimit: true,
      guidanceProgress: true,
    },
  });

  if (!user?.onboardingComplete) {
    redirect("/dashboard/onboarding");
  }

  // Get today's trades
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTrades, allOpenTrades, recentTrades, latestSuggestion, goals, holdingsCount, fundsCount] =
    await Promise.all([
      prisma.trade.findMany({
        where: { userId, createdAt: { gte: today, lt: tomorrow } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.trade.findMany({
        where: { userId, status: "OPEN" },
      }),
      prisma.trade.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { strategy: true },
      }),
      prisma.aiSuggestion.findFirst({
        where: { userId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.tradingGoal.findMany({
        where: { userId, achieved: false },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
      prisma.stockHolding.count({ where: { userId } }),
      prisma.mutualFund.count({ where: { userId } }),
    ]);

  // Calculate today's stats
  const closedToday = todayTrades.filter((t) => t.status === "CLOSED");
  const todayPnl = closedToday.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const todayWinners = closedToday.filter((t) => (t.netPnl || 0) > 0).length;
  const todayLosers = closedToday.filter((t) => (t.netPnl || 0) < 0).length;
  const winRate =
    closedToday.length > 0
      ? (todayWinners / closedToday.length) * 100
      : 0;

  const isNewUser = !user.guidanceProgress ||
    (typeof user.guidanceProgress === "object" &&
      !(user.guidanceProgress as Record<string, boolean>).dismissed);

  const hasPortfolio = holdingsCount > 0 || fundsCount > 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header + What to Do Next */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user.name?.split(" ")[0] || "Trader"}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your complete financial overview.
          </p>
        </div>
        <NextAction />
        <DailyTip />
      </div>

      {/* Row 1: Net Worth + Today's P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <NetWorthCard
          capitalAmount={user.capitalAmount || 0}
          holdingsCount={holdingsCount}
          fundsCount={fundsCount}
        />
        <DailyPnlCard pnl={todayPnl} />
      </div>

      {/* Row 2: Quick Glance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStats
          label="Trades Today"
          value={closedToday.length.toString()}
          subtitle={`${todayWinners}W / ${todayLosers}L`}
          color="blue"
        />
        <QuickStats
          label="Win Rate"
          value={`${winRate.toFixed(0)}%`}
          subtitle={
            closedToday.length === 0
              ? "No trades yet"
              : `${closedToday.length} trades`
          }
          color="violet"
        />
        <QuickStats
          label="Open Positions"
          value={allOpenTrades.length.toString()}
          subtitle={allOpenTrades.length > 0 ? "Live tracking below" : "None right now"}
          color="amber"
        />
        <QuickStats
          label="Portfolio"
          value={`${holdingsCount + fundsCount}`}
          subtitle={
            hasPortfolio
              ? `${holdingsCount} stocks, ${fundsCount} funds`
              : "No investments yet"
          }
          color="emerald"
        />
      </div>

      {/* Getting Started Guide (new users) */}
      {isNewUser && <GettingStarted />}

      {/* Open Positions - live intraday tracking */}
      {allOpenTrades.length > 0 && <OpenPositions />}

      {/* Live Stock Holdings with prices */}
      {holdingsCount > 0 && <LiveHoldings />}

      {/* Mutual Funds Snapshot with NAVs */}
      {fundsCount > 0 && <MfSnapshot />}

      {/* Goal Progress */}
      {goals.length > 0 && (
        <GoalProgressSummary
          goals={goals.map((g) => ({
            id: g.id,
            type: g.type,
            targetValue: g.targetValue,
            currentValue: g.currentValue,
            period: g.period,
          }))}
        />
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTrades trades={recentTrades} />
        </div>
        <div className="space-y-6">
          {hasPortfolio && <PortfolioHealthCard />}
          <AiSuggestionCard suggestion={latestSuggestion} />
        </div>
      </div>
    </div>
  );
}
