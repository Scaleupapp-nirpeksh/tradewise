import { NextRequest, NextResponse } from "next/server";
import { searchMutualFunds } from "@/lib/mf-data";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchMutualFunds(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("MF search error:", error);
    return NextResponse.json({ results: [] });
  }
}
