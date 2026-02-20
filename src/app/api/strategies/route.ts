import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const strategies = await prisma.strategy.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ strategies });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { name, description } = await request.json();

  if (!name) {
    return NextResponse.json(
      { error: "Strategy name is required" },
      { status: 400 }
    );
  }

  const strategy = await prisma.strategy.create({
    data: { userId, name, description },
  });

  return NextResponse.json(strategy);
}
