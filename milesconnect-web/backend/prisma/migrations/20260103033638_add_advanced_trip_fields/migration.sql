-- AlterTable
ALTER TABLE "TripSheet" ADD COLUMN     "adBlueExpenseCents" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "driverAdvanceCents" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "driverAllowanceCents" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "loadingUnloadingCents" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "policeExpenseCents" BIGINT NOT NULL DEFAULT 0;
