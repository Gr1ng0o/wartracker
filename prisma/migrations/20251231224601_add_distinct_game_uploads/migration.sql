/*
  Warnings:

  - You are about to drop the column `armyListPdfUrl` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `armyListPdfUrl2` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "armyListPdfUrl",
DROP COLUMN "armyListPdfUrl2",
ADD COLUMN     "myArmyPdfUrl" TEXT,
ADD COLUMN     "oppArmyPdfUrl" TEXT;
