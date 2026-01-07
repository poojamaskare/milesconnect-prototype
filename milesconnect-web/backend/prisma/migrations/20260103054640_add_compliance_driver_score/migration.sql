-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "expiryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalTrips" INTEGER NOT NULL DEFAULT 0;
