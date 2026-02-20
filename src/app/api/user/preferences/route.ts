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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { suggestionPreferences: true },
  });

  return NextResponse.json({ preferences: user?.suggestionPreferences || null });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    await prisma.user.update({
      where: { id: userId },
      data: { suggestionPreferences: body.suggestionPreferences },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[preferences] ERROR:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to save preferences", details: message }, { status: 500 });
  }
}
