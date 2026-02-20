import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChargeProfileForBroker } from "@/lib/charges";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { name, capitalAmount, dailyLossLimit, brokerName } =
    await request.json();

  const chargeProfile = getChargeProfileForBroker(brokerName);

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || undefined,
      capitalAmount: capitalAmount || 100000,
      dailyLossLimit: dailyLossLimit || 2000,
      brokerName: brokerName || "Groww",
      brokerChargeProfile: JSON.parse(JSON.stringify(chargeProfile)),
      onboardingComplete: true,
    },
  });

  // Create some default strategies
  const defaultStrategies = [
    { name: "Breakout", description: "Price breaks above resistance level" },
    { name: "VWAP Reversal", description: "Price reverses from VWAP line" },
    { name: "Opening Range Breakout", description: "Trade based on first 15-30 min range" },
    { name: "Support Bounce", description: "Price bounces off support level" },
    { name: "Momentum", description: "Trading with strong price momentum" },
  ];

  for (const strategy of defaultStrategies) {
    await prisma.strategy.upsert({
      where: { userId_name: { userId, name: strategy.name } },
      update: {},
      create: {
        userId,
        name: strategy.name,
        description: strategy.description,
      },
    });
  }

  return NextResponse.json({ success: true });
}
