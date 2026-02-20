import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !["FOLLOWED", "IGNORED"].includes(status)) {
    return NextResponse.json(
      { error: "Status must be FOLLOWED or IGNORED" },
      { status: 400 }
    );
  }

  const suggestion = await prisma.aiSuggestion.findFirst({
    where: { id, userId },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.aiSuggestion.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ suggestion: updated });
}
