-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "priceCents" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TripSheet" ADD COLUMN     "netProfitCents" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalRevenueCents" BIGINT NOT NULL DEFAULT 0;
