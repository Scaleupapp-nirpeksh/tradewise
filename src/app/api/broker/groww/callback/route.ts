import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GrowwAdapter } from "@/lib/broker/groww";

// Groww OAuth redirects here with ?code=...
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=groww_no_code", request.url)
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { growwApiKey: true },
  });

  if (!user?.growwApiKey) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=groww_no_key", request.url)
    );
  }

  try {
    const adapter = new GrowwAdapter(user.growwApiKey, "");
    const { accessToken, expiresAt } = await adapter.handleAuthCallback(code);

    await prisma.user.update({
      where: { id: userId },
      data: {
        growwAccessToken: accessToken,
        growwTokenExpiry: expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard/settings?groww=connected", request.url)
    );
  } catch (error) {
    console.error("Groww OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=groww_auth_failed", request.url)
    );
  }
}
