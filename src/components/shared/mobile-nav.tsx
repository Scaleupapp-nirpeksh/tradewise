"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  FileUp,
  Home,
  LogOut,
  Menu,
  PiggyBank,
  Plus,
  Settings,
  Target,
  TrendingUp,
  ListOrdered,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useState } from "react";
import { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ href: "/dashboard", icon: Home, label: "Dashboard" }],
  },
  {
    label: "Intraday",
    items: [
      { href: "/dashboard/trades", icon: ListOrdered, label: "My Trades" },
      { href: "/dashboard/trades/new", icon: Plus, label: "Add Trade" },
    ],
  },
  {
    label: "Stocks",
    items: [
      { href: "/dashboard/stocks", icon: Briefcase, label: "My Holdings" },
      { href: "/dashboard/stocks/add", icon: Plus, label: "Add Holding" },
    ],
  },
  {
    label: "Mutual Funds",
    items: [
      { href: "/dashboard/mutual-funds", icon: PiggyBank, label: "My Funds" },
      { href: "/dashboard/mutual-funds/add", icon: Plus, label: "Add Fund" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/dashboard/suggestions", icon: Brain, label: "AI Suggestions" },
      { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/dashboard/journal", icon: BookOpen, label: "Journal" },
      { href: "/dashboard/calculator", icon: Calculator, label: "Risk Calculator" },
      { href: "/dashboard/goals", icon: Target, label: "Goals" },
      { href: "/dashboard/import", icon: FileUp, label: "Import" },
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold">TradeWise</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80vw] sm:w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex items-center gap-2 px-6 py-5 border-b">
                <div className="h-7 w-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">TradeWise</span>
              </div>
              <nav className="px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
                {navGroups.map((group, gi) => (
                  <div key={gi}>
                    {group.label && (
                      <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {group.label}
                      </p>
                    )}
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" &&
                          pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
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
                  </div>
                ))}
              </nav>
              <div className="px-3 py-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-red-600"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
