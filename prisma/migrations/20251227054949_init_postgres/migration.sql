-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameType" TEXT NOT NULL,
    "build" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "first" BOOLEAN NOT NULL,
    "result" TEXT NOT NULL,
    "score" INTEGER,
    "tag1" TEXT,
    "tag2" TEXT,
    "notes" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);
