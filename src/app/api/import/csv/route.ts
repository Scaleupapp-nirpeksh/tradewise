import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNetPnl } from "@/lib/charges";
import { BrokerChargeProfile } from "@/types";
import Papa from "papaparse";

// Column name mappings for different broker formats
const COLUMN_MAPS: Record<string, string> = {
  symbol: "symbol",
  stock: "symbol",
  scrip: "symbol",
  instrument: "symbol",
  trade_type: "side",
  side: "side",
  type: "side",
  "buy/sell": "side",
  quantity: "quantity",
  qty: "quantity",
  trade_qty: "quantity",
  buy_price: "entryPrice",
  entry_price: "entryPrice",
  entry: "entryPrice",
  price: "entryPrice",
  sell_price: "exitPrice",
  exit_price: "exitPrice",
  exit: "exitPrice",
  trade_date: "entryTime",
  date: "entryTime",
  time: "entryTime",
  entry_time: "entryTime",
};

function normalizeColumnName(col: string): string {
  const normalized = col.toLowerCase().trim().replace(/\s+/g, "_");
  return COLUMN_MAPS[normalized] || normalized;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const isPreview = formData.get("preview") === "true";

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      { error: `CSV parsing error: ${parsed.errors[0].message}` },
      { status: 400 }
    );
  }

  const rows = parsed.data as Record<string, string>[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "No data found in CSV" }, { status: 400 });
  }

  // Normalize column names
  const trades = rows
    .map((row) => {
      const normalized: Record<string, string> = {};
      Object.entries(row).forEach(([key, value]) => {
        normalized[normalizeColumnName(key)] = value;
      });

      const side = (normalized.side || "BUY").toUpperCase();
      return {
        symbol: (normalized.symbol || "").toUpperCase().trim(),
        side: side === "SELL" || side === "S" ? "SELL" : "BUY",
        quantity: parseInt(normalized.quantity || "0"),
        entryPrice: parseFloat(normalized.entryPrice || "0"),
        exitPrice: parseFloat(normalized.exitPrice || "0"),
        entryTime:
          normalized.entryTime || new Date().toISOString(),
      };
    })
    .filter(
      (t) =>
        t.symbol && t.quantity > 0 && t.entryPrice > 0 && t.exitPrice > 0
    );

  if (trades.length === 0) {
    return NextResponse.json(
      {
        error:
          "No valid trades found. Make sure your CSV has columns: symbol, side, quantity, entry_price, exit_price",
      },
      { status: 400 }
    );
  }

  if (isPreview) {
    return NextResponse.json({ trades: trades.slice(0, 50) });
  }

  // Import trades
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { brokerChargeProfile: true },
  });

  const chargeProfile = user?.brokerChargeProfile as BrokerChargeProfile | null;

  let imported = 0;
  for (const trade of trades) {
    const { grossPnl, charges, netPnl } = calculateNetPnl(
      trade.side as "BUY" | "SELL",
      trade.entryPrice,
      trade.exitPrice,
      trade.quantity,
      "NSE",
      chargeProfile || undefined
    );

    await prisma.trade.create({
      data: {
        userId,
        symbol: trade.symbol,
        exchange: "NSE",
        side: trade.side as "BUY" | "SELL",
        quantity: trade.quantity,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        entryTime: new Date(trade.entryTime),
        exitTime: new Date(trade.entryTime),
        grossPnl,
        netPnl,
        charges: JSON.parse(JSON.stringify(charges)),
        status: "CLOSED",
      },
    });
    imported++;
  }

  return NextResponse.json({ imported });
}
