import { NextResponse } from "next/server";
import { sendOTP, normalizePhone } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(phone);
    const digits = normalized.replace(/\D/g, "");

    if (digits.length !== 12 || !digits.startsWith("91")) {
      return NextResponse.json(
        { error: "Please enter a valid Indian phone number" },
        { status: 400 }
      );
    }

    const result = await sendOTP(normalized);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
