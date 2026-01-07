-- AlterEnum
ALTER TYPE "TripSheetStatus" ADD VALUE 'SETTLED';

-- AlterTable
ALTER TABLE "TripSheet" ADD COLUMN     "cashBalanceCents" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "settledAt" TIMESTAMP(3);
