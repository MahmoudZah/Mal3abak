-- AlterTable
ALTER TABLE "Court" ADD COLUMN "governorate" TEXT;
ALTER TABLE "Court" ADD COLUMN "region" TEXT;

-- Set default values for existing courts (you can modify these based on your existing data)
UPDATE "Court" SET "governorate" = 'cairo', "region" = 'nasr-city' WHERE "governorate" IS NULL;

-- Make columns required
ALTER TABLE "Court" ALTER COLUMN "governorate" SET NOT NULL;
ALTER TABLE "Court" ALTER COLUMN "region" SET NOT NULL;

-- Make location optional
ALTER TABLE "Court" ALTER COLUMN "location" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Court_governorate_region_idx" ON "Court"("governorate", "region");

