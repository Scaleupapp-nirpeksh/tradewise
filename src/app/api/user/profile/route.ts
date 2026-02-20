import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChargeProfileForBroker } from "@/lib/charges";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      capitalAmount: true,
      dailyLossLimit: true,
      brokerName: true,
      onboardingComplete: true,
      smsAlertsEnabled: true,
      dailySummaryEnabled: true,
      morningAiEnabled: true,
      priceAlertThreshold: true,
      guidanceProgress: true,
      growwApiKey: true,
      growwAccessToken: true,
      growwTokenExpiry: true,
    },
  });

  // Don't expose raw secrets — derive connection status
  const growwConnected = !!(user?.growwApiKey && user?.growwAccessToken);
  const growwTokenExpired = user?.growwTokenExpiry
    ? new Date(user.growwTokenExpiry) < new Date()
    : false;

  return NextResponse.json({
    user: {
      ...user,
      growwApiKey: user?.growwApiKey ? "***configured***" : null,
      growwAccessToken: undefined,
      growwTokenExpiry: undefined,
      growwConnected,
      growwTokenExpired,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.capitalAmount !== undefined)
    data.capitalAmount = body.capitalAmount;
  if (body.dailyLossLimit !== undefined)
    data.dailyLossLimit = body.dailyLossLimit;
  if (body.brokerName !== undefined) {
    data.brokerName = body.brokerName;
    data.brokerChargeProfile = getChargeProfileForBroker(body.brokerName);
  }
  if (body.smsAlertsEnabled !== undefined)
    data.smsAlertsEnabled = body.smsAlertsEnabled;
  if (body.dailySummaryEnabled !== undefined)
    data.dailySummaryEnabled = body.dailySummaryEnabled;
  if (body.morningAiEnabled !== undefined)
    data.morningAiEnabled = body.morningAiEnabled;
  if (body.priceAlertThreshold !== undefined)
    data.priceAlertThreshold = body.priceAlertThreshold;
  if (body.guidanceProgress !== undefined)
    data.guidanceProgress = body.guidanceProgress;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return NextResponse.json({ user });
}
