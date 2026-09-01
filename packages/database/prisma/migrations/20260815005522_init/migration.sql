/*
  Warnings:

  - You are about to drop the column `body` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `BlogPost` table. All the data in the column will be lost.
  - Added the required column `assets` to the `BlogPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `template` to the `BlogPost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Templates" AS ENUM ('Template1');

-- AlterTable
ALTER TABLE "BlogPost" DROP COLUMN "body",
DROP COLUMN "image",
ADD COLUMN     "assets" JSONB NOT NULL,
ADD COLUMN     "template" "Templates" NOT NULL;
