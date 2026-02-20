import { prisma } from "@/lib/prisma";
import { BrokerAdapter } from "./types";
import { GrowwAdapter } from "./groww";

export async function getBrokerAdapter(
  userId: string
): Promise<BrokerAdapter | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      brokerName: true,
      growwApiKey: true,
      growwAccessToken: true,
      growwTokenExpiry: true,
    },
  });

  if (!user) return null;

  if (
    user.brokerName === "Groww" &&
    user.growwApiKey &&
    user.growwAccessToken
  ) {
    // Check token expiry
    if (user.growwTokenExpiry && user.growwTokenExpiry < new Date()) {
      console.warn("Groww access token expired for user", userId);
      return null;
    }

    return new GrowwAdapter(user.growwApiKey, user.growwAccessToken);
  }

  // Future: Add support for Zerodha, Angel One, etc.
  return null;
}

export { type BrokerAdapter } from "./types";
