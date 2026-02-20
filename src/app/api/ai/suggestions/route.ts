import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const statusParam = req.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = { userId };
  if (statusParam) {
    const statuses = statusParam.split(",").map((s) => s.trim());
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }

  const suggestions = await prisma.aiSuggestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ suggestions });
}
