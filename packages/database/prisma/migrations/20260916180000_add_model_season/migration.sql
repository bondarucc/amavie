-- CreateEnum
CREATE TYPE "ModelSeason" AS ENUM ('Winter', 'Summer', 'MidSeason');

-- AlterTable
ALTER TABLE "Model" ADD COLUMN "season" "ModelSeason" NOT NULL DEFAULT 'MidSeason';

ALTER TABLE "Model" ALTER COLUMN "season" DROP DEFAULT;
