CREATE TABLE "Media" (
 "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "gameId" TEXT, "name" TEXT NOT NULL, "caption" TEXT NOT NULL DEFAULT '',
 "mimeType" TEXT NOT NULL, "size" INTEGER NOT NULL, "path" TEXT NOT NULL,
 "phase" TEXT NOT NULL DEFAULT 'general', "status" TEXT NOT NULL DEFAULT 'pending',
 CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Media_path_key" ON "Media"("path");
CREATE INDEX "Media_gameId_createdAt_idx" ON "Media"("gameId", "createdAt");
CREATE INDEX "Media_status_createdAt_idx" ON "Media"("status", "createdAt");
ALTER TABLE "Media" ADD CONSTRAINT "Media_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Game" ADD COLUMN "playedAt" TIMESTAMP(3), ADD COLUMN "points" INTEGER, ADD COLUMN "missionPack" TEXT, ADD COLUMN "primaryMission" TEXT, ADD COLUMN "deployment" TEXT, ADD COLUMN "terrainLayout" TEXT;
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "myListText" TEXT, ADD COLUMN IF NOT EXISTS "oppListText" TEXT;
ALTER TABLE "Media" ENABLE ROW LEVEL SECURITY;
