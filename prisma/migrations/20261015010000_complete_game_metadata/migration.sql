-- Additive and safe for databases where these fields were added manually.
ALTER TABLE "Game"
  ADD COLUMN IF NOT EXISTS "playedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "points" INTEGER,
  ADD COLUMN IF NOT EXISTS "missionPack" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryMission" TEXT,
  ADD COLUMN IF NOT EXISTS "deployment" TEXT,
  ADD COLUMN IF NOT EXISTS "terrainLayout" TEXT,
  ADD COLUMN IF NOT EXISTS "myListText" TEXT,
  ADD COLUMN IF NOT EXISTS "oppListText" TEXT;
