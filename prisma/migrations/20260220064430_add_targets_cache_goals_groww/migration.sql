-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('NET_PNL', 'WIN_RATE', 'MAX_LOSS_PER_TRADE', 'TOTAL_TRADES');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PositionAction" AS ENUM ('HOLD', 'SELL', 'BUY_MORE');

-- AlterTable
ALTER TABLE "AlertLog" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "tradeId" TEXT;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "brokerOrderId" TEXT,
ADD COLUMN     "stopLossPrice" DOUBLE PRECISION,
ADD COLUMN     "targetPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailySummaryEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "growwAccessToken" TEXT,
ADD COLUMN     "growwApiKey" TEXT,
ADD COLUMN     "growwApiSecret" TEXT,
ADD COLUMN     "growwTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "guidanceProgress" JSONB,
ADD COLUMN     "morningAiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priceAlertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "smsAlertsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PriceCache" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL DEFAULT 'NSE',
    "price" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "changePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'twelve_data',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "period" "GoalPeriod" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPositionAdvice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "action" "PositionAction" NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "confidence" "SuggestionConfidence" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPositionAdvice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceCache_symbol_key" ON "PriceCache"("symbol");

-- CreateIndex
CREATE INDEX "PriceCache_symbol_idx" ON "PriceCache"("symbol");

-- CreateIndex
CREATE INDEX "TradingGoal_userId_period_idx" ON "TradingGoal"("userId", "period");

-- CreateIndex
CREATE INDEX "AiPositionAdvice_userId_createdAt_idx" ON "AiPositionAdvice"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TradingGoal" ADD CONSTRAINT "TradingGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPositionAdvice" ADD CONSTRAINT "AiPositionAdvice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPositionAdvice" ADD CONSTRAINT "AiPositionAdvice_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
