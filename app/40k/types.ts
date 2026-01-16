export type GameDTO = {
  id: string;
  createdAt: string;
  gameType: string;

  build?: string;
  first?: boolean;
  score?: number | null;
  tag1?: string | null;
  tag2?: string | null;

  armyListPdfUrl?: string | null;
  armyListPdfUrl2?: string | null;

  playedAt?: string | null;
  opponent?: string | null;
  points?: number | null;

  missionPack?: string | null;
  primaryMission?: string | null;
  deployment?: string | null;
  terrainLayout?: string | null;

  myFaction?: string | null;
  myDetachment?: string | null;
  myArmyPdfUrl?: string | null;
  myListText?: string | null;

  oppFaction?: string | null;
  oppDetachment?: string | null;
  oppArmyPdfUrl?: string | null;
  oppListText?: string | null;

  scoreSheetUrl?: string | null;

  myScore?: number | null;
  oppScore?: number | null;
  result?: "W" | "L" | "D" | string;

  notes?: string | null;

  photoUrls?: string[];

  /* =========================
   * V1 – Timeline (tour par tour)
   * ========================= */

  deploymentPhotoUrl?: string | null;
  t1PhotoUrl?: string | null;
  t2PhotoUrl?: string | null;
  t3PhotoUrl?: string | null;
  t4PhotoUrl?: string | null;
  t5PhotoUrl?: string | null;

  deploymentNotes?: string | null;
  t1Notes?: string | null;
  t2Notes?: string | null;
  t3Notes?: string | null;
  t4Notes?: string | null;
  t5Notes?: string | null;
};
