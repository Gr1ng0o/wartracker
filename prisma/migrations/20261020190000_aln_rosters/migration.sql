CREATE TABLE "ArmyRoster" (
 "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 "importKey" TEXT NOT NULL, "name" TEXT NOT NULL, "faction" TEXT NOT NULL, "detachment" TEXT NOT NULL,
 "side" TEXT NOT NULL DEFAULT 'my', "gameId" TEXT, "sourceHash" TEXT NOT NULL, "declaredPoints" INTEGER, "declaredModels" INTEGER, "declaredUnits" INTEGER,
 CONSTRAINT "ArmyRoster_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ArmyRoster_importKey_key" ON "ArmyRoster"("importKey");
CREATE UNIQUE INDEX "ArmyRoster_gameId_side_key" ON "ArmyRoster"("gameId", "side");
ALTER TABLE "ArmyRoster" ADD CONSTRAINT "ArmyRoster_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "RosterUnit" (
 "id" TEXT NOT NULL, "rosterId" TEXT NOT NULL, "position" INTEGER NOT NULL, "name" TEXT NOT NULL, "unitKey" TEXT NOT NULL,
 "category" TEXT NOT NULL, "models" INTEGER NOT NULL, "points" INTEGER NOT NULL, "leader" BOOLEAN NOT NULL DEFAULT false,
 "attachedToPosition" INTEGER, "profile" JSONB, "equipment" TEXT[] NOT NULL, "enhancements" TEXT[] NOT NULL, "weapons" TEXT[] NOT NULL,
 CONSTRAINT "RosterUnit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RosterUnit_rosterId_position_key" ON "RosterUnit"("rosterId", "position");
CREATE INDEX "RosterUnit_unitKey_idx" ON "RosterUnit"("unitKey");
ALTER TABLE "RosterUnit" ADD CONSTRAINT "RosterUnit_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "ArmyRoster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArmyRoster" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RosterUnit" ENABLE ROW LEVEL SECURITY;
