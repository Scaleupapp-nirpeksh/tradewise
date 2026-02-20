import { RiskCalculation } from "@/types";

export function calculatePositionSize(params: {
  capital: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
}): RiskCalculation {
  const { capital, riskPercentage, entryPrice, stopLossPrice } = params;

  const maxRiskAmount = capital * (riskPercentage / 100);
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);

  if (riskPerShare <= 0) {
    return {
      positionSize: 0,
      capitalRequired: 0,
      maxLoss: 0,
      potentialProfit: 0,
      riskRewardRatio: 0,
      capitalPercentage: 0,
      riskPercentage: 0,
    };
  }

  const positionSize = Math.floor(maxRiskAmount / riskPerShare);
  const capitalRequired = positionSize * entryPrice;
  const maxLoss = positionSize * riskPerShare;

  return {
    positionSize,
    capitalRequired,
    maxLoss,
    potentialProfit: 0,
    riskRewardRatio: 0,
    capitalPercentage: capital > 0 ? (capitalRequired / capital) * 100 : 0,
    riskPercentage: capital > 0 ? (maxLoss / capital) * 100 : 0,
  };
}

export function calculateRiskReward(params: {
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  quantity: number;
}): {
  riskRewardRatio: number;
  maxLoss: number;
  potentialProfit: number;
  riskPerShare: number;
  rewardPerShare: number;
} {
  const { entryPrice, targetPrice, stopLossPrice, quantity } = params;

  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  const rewardPerShare = Math.abs(targetPrice - entryPrice);
  const riskRewardRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;

  return {
    riskRewardRatio,
    maxLoss: riskPerShare * quantity,
    potentialProfit: rewardPerShare * quantity,
    riskPerShare,
    rewardPerShare,
  };
}

export function getPositionSizeRecommendation(params: {
  capital: number;
  dailyLossLimit: number;
  currentDayLoss: number;
  entryPrice: number;
  stopLossPrice: number;
}): { recommendedQty: number; maxQty: number; reason: string } {
  const { capital, dailyLossLimit, currentDayLoss, entryPrice, stopLossPrice } =
    params;

  const remainingRisk = dailyLossLimit - Math.abs(currentDayLoss);
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);

  if (remainingRisk <= 0) {
    return {
      recommendedQty: 0,
      maxQty: 0,
      reason: "You have already hit your daily loss limit. No more trades recommended today.",
    };
  }

  if (riskPerShare <= 0) {
    return {
      recommendedQty: 0,
      maxQty: 0,
      reason: "Entry and stop-loss prices must be different.",
    };
  }

  const maxQty = Math.floor(remainingRisk / riskPerShare);
  const maxByCapital = Math.floor(capital * 0.1 / entryPrice); // Max 10% of capital per trade
  const recommendedQty = Math.min(maxQty, maxByCapital);

  let reason = `Based on Rs${remainingRisk.toFixed(0)} remaining risk today`;
  if (recommendedQty < maxQty) {
    reason += ` (capped at 10% of capital)`;
  }

  return { recommendedQty, maxQty, reason };
}
