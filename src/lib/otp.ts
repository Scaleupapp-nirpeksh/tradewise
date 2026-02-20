import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_OTPS_PER_WINDOW = 3;

export function generateOTP(): string {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0);
  const otp = (num % 900000) + 100000;
  return otp.toString();
}

export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (phone.startsWith("+")) {
    return phone.replace(/\s/g, "");
  }

  return `+${digits}`;
}

export async function sendOTP(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedPhone = normalizePhone(phone);

  // Rate limiting
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  );
  const recentCount = await prisma.otp.count({
    where: {
      phone: normalizedPhone,
      createdAt: { gte: windowStart },
    },
  });

  if (recentCount >= MAX_OTPS_PER_WINDOW) {
    return {
      success: false,
      error: "Too many OTP requests. Please wait a few minutes.",
    };
  }

  // Invalidate previous unused OTPs
  await prisma.otp.updateMany({
    where: { phone: normalizedPhone, verified: false },
    data: { verified: true },
  });

  const code = generateOTP();
  const hashedCode = hashOTP(code);
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otp.create({
    data: {
      phone: normalizedPhone,
      code: hashedCode,
      expires,
    },
  });

  const message = `${code} is your TradeWise login code. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
  const sent = await sendSMS(normalizedPhone, message);

  if (!sent) {
    return { success: false, error: "Failed to send SMS. Please try again." };
  }

  // Cleanup old expired OTPs
  await prisma.otp.deleteMany({
    where: { expires: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
  });

  return { success: true };
}

export async function verifyOTP(
  phone: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const normalizedPhone = normalizePhone(phone);
  const hashedCode = hashOTP(code);

  const otp = await prisma.otp.findFirst({
    where: {
      phone: normalizedPhone,
      verified: false,
      expires: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return {
      valid: false,
      error: "OTP expired or not found. Please request a new one.",
    };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });
    return {
      valid: false,
      error: "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  if (otp.code !== hashedCode) {
    await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { valid: false, error: "Incorrect OTP. Please try again." };
  }

  await prisma.otp.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return { valid: true };
}
