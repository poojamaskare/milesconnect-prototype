-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastMaintenanceDate" TIMESTAMP(3),
ADD COLUMN     "maintenanceCycleDays" INTEGER,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "nextMaintenanceDate" TIMESTAMP(3);
