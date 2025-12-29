-- AlterTable
ALTER TABLE "TripSheet" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "endLocation" TEXT,
ADD COLUMN     "fuelAtEnd" DOUBLE PRECISION,
ADD COLUMN     "fuelAtStart" DOUBLE PRECISION,
ADD COLUMN     "fuelExpenseCents" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "managerApprovedAt" TIMESTAMP(3),
ADD COLUMN     "managerApprovedById" UUID,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "otherExpenseCents" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "routeDescription" TEXT,
ADD COLUMN     "startLocation" TEXT,
ADD COLUMN     "tollExpenseCents" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalExpenseCents" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "FuelStop" (
    "id" UUID NOT NULL,
    "tripSheetId" UUID NOT NULL,
    "location" TEXT NOT NULL,
    "odometerKm" INTEGER,
    "fuelLiters" DOUBLE PRECISION NOT NULL,
    "pricePerLiter" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "totalCostCents" BIGINT NOT NULL,
    "receiptNumber" TEXT,
    "notes" TEXT,
    "fueledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripExpense" (
    "id" UUID NOT NULL,
    "tripSheetId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "amountCents" BIGINT NOT NULL,
    "receiptNumber" TEXT,
    "notes" TEXT,
    "expenseAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FuelStop_tripSheetId_idx" ON "FuelStop"("tripSheetId");

-- CreateIndex
CREATE INDEX "TripExpense_tripSheetId_idx" ON "TripExpense"("tripSheetId");

-- CreateIndex
CREATE INDEX "TripExpense_category_idx" ON "TripExpense"("category");

-- AddForeignKey
ALTER TABLE "FuelStop" ADD CONSTRAINT "FuelStop_tripSheetId_fkey" FOREIGN KEY ("tripSheetId") REFERENCES "TripSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripExpense" ADD CONSTRAINT "TripExpense_tripSheetId_fkey" FOREIGN KEY ("tripSheetId") REFERENCES "TripSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
