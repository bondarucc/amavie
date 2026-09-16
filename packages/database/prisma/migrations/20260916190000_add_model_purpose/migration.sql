-- CreateEnum
CREATE TYPE "ModelPurpose" AS ENUM ('Everyday', 'Dressy', 'Sport', 'Home', 'Business');

-- AlterTable
ALTER TABLE "Model" ADD COLUMN "purposes" "ModelPurpose"[] NOT NULL DEFAULT ARRAY['Home']::"ModelPurpose"[];

ALTER TABLE "Model" ALTER COLUMN "purposes" DROP DEFAULT;
