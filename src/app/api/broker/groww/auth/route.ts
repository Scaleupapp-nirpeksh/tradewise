import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GrowwAdapter } from "@/lib/broker/groww";

// GET: Return Groww OAuth URL
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { growwApiKey: true, growwAccessToken: true },
  });

  if (!user?.growwApiKey) {
    return NextResponse.json({
      error: "Groww API key not configured. Add it in Settings.",
    }, { status: 400 });
  }

  const adapter = new GrowwAdapter(user.growwApiKey, "");
  const authUrl = adapter.getAuthUrl();

  return NextResponse.json({ authUrl });
}

// POST: Handle OAuth callback / save credentials
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();

  // Direct API key/secret setup (for initial connection)
  if (body.apiKey && body.apiSecret) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        growwApiKey: body.apiKey,
        growwApiSecret: body.apiSecret,
      },
    });
    return NextResponse.json({ success: true, message: "Groww API credentials saved" });
  }

  // OAuth callback with authorization code
  if (body.code) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { growwApiKey: true },
    });

    if (!user?.growwApiKey) {
      return NextResponse.json({ error: "API key not set" }, { status: 400 });
    }

    try {
      const adapter = new GrowwAdapter(user.growwApiKey, "");
      const { accessToken, expiresAt } = await adapter.handleAuthCallback(body.code);

      await prisma.user.update({
        where: { id: userId },
        data: {
          growwAccessToken: accessToken,
          growwTokenExpiry: expiresAt,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Groww OAuth error:", error);
      return NextResponse.json({ error: "OAuth failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
