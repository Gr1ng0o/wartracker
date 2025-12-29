/*
  Warnings:

  - You are about to drop the column `opponentDetachment` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `opponentFaction` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `playerDetachment` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `playerFaction` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `scoreAgainst` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `scoreFor` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the `Attachment` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `first` on table `Game` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_gameId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "opponentDetachment",
DROP COLUMN "opponentFaction",
DROP COLUMN "playerDetachment",
DROP COLUMN "playerFaction",
DROP COLUMN "scoreAgainst",
DROP COLUMN "scoreFor",
ADD COLUMN     "armyListPdfUrl" TEXT,
ADD COLUMN     "myDetachment" TEXT,
ADD COLUMN     "myFaction" TEXT,
ADD COLUMN     "myScore" INTEGER,
ADD COLUMN     "oppDetachment" TEXT,
ADD COLUMN     "oppFaction" TEXT,
ADD COLUMN     "oppScore" INTEGER,
ADD COLUMN     "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "first" SET NOT NULL,
ALTER COLUMN "first" SET DEFAULT true;

-- DropTable
DROP TABLE "Attachment";
