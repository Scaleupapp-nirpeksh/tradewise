import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Delete expired OTPs
  const deletedOtps = await prisma.otp.deleteMany({
    where: { expires: { lt: oneHourAgo } },
  });

  // Expire old PENDING AI suggestions (older than 24 hours)
  const expiredSuggestions = await prisma.aiSuggestion.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: oneDayAgo },
    },
    data: { status: "EXPIRED" },
  });

  // Clean up stale price cache entries (older than 1 day)
  const deletedCache = await prisma.priceCache.deleteMany({
    where: { updatedAt: { lt: oneDayAgo } },
  });

  return NextResponse.json({
    success: true,
    deletedOtps: deletedOtps.count,
    expiredSuggestions: expiredSuggestions.count,
    deletedCacheEntries: deletedCache.count,
  });
}
