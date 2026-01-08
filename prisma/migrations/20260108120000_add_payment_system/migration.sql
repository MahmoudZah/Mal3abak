-- AlterTable
ALTER TABLE "Court" ADD COLUMN "paymentName" TEXT,
ADD COLUMN "paymentPhone" TEXT,
ADD COLUMN "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN "paymentProof" TEXT;

