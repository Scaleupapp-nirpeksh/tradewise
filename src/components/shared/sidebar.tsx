"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  BookOpen,
  Brain,
  Calculator,
  FileUp,
  Home,
  LogOut,
  Plus,
  Settings,
  Target,
  TrendingUp,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarketStatus } from "@/components/shared/market-status";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/trades", icon: ListOrdered, label: "My Trades" },
  { href: "/dashboard/trades/new", icon: Plus, label: "Add Trade" },
  { href: "/dashboard/suggestions", icon: Brain, label: "AI Suggestions" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/journal", icon: BookOpen, label: "Journal" },
  { href: "/dashboard/calculator", icon: Calculator, label: "Risk Calculator" },
  { href: "/dashboard/goals", icon: Target, label: "Goals" },
  { href: "/dashboard/import", icon: FileUp, label: "Import Trades" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="h-7 w-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold">TradeWise</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Market Status */}
      <div className="px-3 py-2 border-t">
        <MarketStatus />
      </div>

      {/* Theme Toggle + Logout */}
      <div className="px-3 py-4 border-t flex items-center justify-between">
        <Button
          variant="ghost"
          className="justify-start text-muted-foreground hover:text-red-600"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Log out
        </Button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
