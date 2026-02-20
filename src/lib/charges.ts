import { ChargeBreakdown, BrokerChargeProfile } from "@/types";

const DEFAULT_CHARGE_PROFILE: BrokerChargeProfile = {
  type: "flat",
  flatFee: 20,
  percentage: 0.03,
  maxBrokerage: 20,
};

// Indian intraday equity trading charges
export function calculateCharges(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  exchange: string = "NSE",
  chargeProfile: BrokerChargeProfile = DEFAULT_CHARGE_PROFILE
): ChargeBreakdown {
  const buyTurnover = entryPrice * quantity;
  const sellTurnover = exitPrice * quantity;
  const totalTurnover = buyTurnover + sellTurnover;

  // 1. Brokerage
  let brokerage: number;
  if (chargeProfile.type === "flat") {
    // Flat fee per order (buy + sell = 2 orders)
    brokerage = chargeProfile.flatFee * 2;
  } else {
    const buyBrokerage = Math.min(
      (buyTurnover * chargeProfile.percentage) / 100,
      chargeProfile.maxBrokerage
    );
    const sellBrokerage = Math.min(
      (sellTurnover * chargeProfile.percentage) / 100,
      chargeProfile.maxBrokerage
    );
    brokerage = buyBrokerage + sellBrokerage;
  }

  // 2. STT (Securities Transaction Tax) - 0.025% on sell side for intraday equity
  const stt = (sellTurnover * 0.025) / 100;

  // 3. Exchange Transaction Charges
  const exchangeRate = exchange === "BSE" ? 0.00375 : 0.00297;
  const exchangeCharges = (totalTurnover * exchangeRate) / 100;

  // 4. GST - 18% on (brokerage + exchange charges)
  const gst = ((brokerage + exchangeCharges) * 18) / 100;

  // 5. SEBI Charges - Rs 10 per crore of turnover
  const sebiCharges = (totalTurnover * 10) / 10000000;

  // 6. Stamp Duty - 0.003% on buy side
  const stampDuty = (buyTurnover * 0.003) / 100;

  const totalCharges =
    brokerage + stt + exchangeCharges + gst + sebiCharges + stampDuty;

  return {
    brokerage: Math.round(brokerage * 100) / 100,
    stt: Math.round(stt * 100) / 100,
    exchangeCharges: Math.round(exchangeCharges * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    sebiCharges: Math.round(sebiCharges * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
  };
}

export function calculateGrossPnl(
  side: "BUY" | "SELL",
  entryPrice: number,
  exitPrice: number,
  quantity: number
): number {
  if (side === "BUY") {
    return (exitPrice - entryPrice) * quantity;
  }
  return (entryPrice - exitPrice) * quantity;
}

export function calculateNetPnl(
  side: "BUY" | "SELL",
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  exchange: string = "NSE",
  chargeProfile?: BrokerChargeProfile
): { grossPnl: number; charges: ChargeBreakdown; netPnl: number } {
  const grossPnl = calculateGrossPnl(side, entryPrice, exitPrice, quantity);
  const charges = calculateCharges(
    entryPrice,
    exitPrice,
    quantity,
    exchange,
    chargeProfile
  );
  const netPnl = grossPnl - charges.totalCharges;

  return {
    grossPnl: Math.round(grossPnl * 100) / 100,
    charges,
    netPnl: Math.round(netPnl * 100) / 100,
  };
}

export function formatINR(amount: number): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function getChargeProfileForBroker(
  brokerName: string
): BrokerChargeProfile {
  const profiles: Record<string, BrokerChargeProfile> = {
    Zerodha: { type: "flat", flatFee: 20, percentage: 0.03, maxBrokerage: 20 },
    Groww: { type: "flat", flatFee: 20, percentage: 0.05, maxBrokerage: 20 },
    "Angel One": {
      type: "flat",
      flatFee: 20,
      percentage: 0.25,
      maxBrokerage: 20,
    },
    Upstox: { type: "flat", flatFee: 20, percentage: 0.05, maxBrokerage: 20 },
    "ICICI Direct": {
      type: "percentage",
      flatFee: 0,
      percentage: 0.275,
      maxBrokerage: 9999,
    },
    "HDFC Securities": {
      type: "percentage",
      flatFee: 0,
      percentage: 0.5,
      maxBrokerage: 9999,
    },
  };
  return profiles[brokerName] || DEFAULT_CHARGE_PROFILE;
}
