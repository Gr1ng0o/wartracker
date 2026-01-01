/**
 * 🔒 DTO SAFE partagé serveur / client
 * WarTracker — v1 (Warhammer 40k)
 *
 * - Médias : liens Google Drive (optionnels)
 * - Inputs rapides : date/opponent/points + mission line + factions + score + notes
 */

/**
 * 🔒 DTO SAFE partagé serveur / client
 * Compatible v1 (WarTracker 40k) + legacy (routes /games)
 */
export type GameDTO = {
  id: string;
  createdAt: string; // fallback / audit
  gameType: string;  // "40k" | "FaB" etc.

  /* =========================
   * LEGACY (à garder pour build)
   * ========================= */

  build?: string;               // utilisé par anciennes pages
  first?: boolean;
  score?: number | null;
  tag1?: string | null;
  tag2?: string | null;

  // anciens noms PDF (encore référencés dans du code legacy)
  armyListPdfUrl?: string | null;   // = myArmyPdfUrl
  armyListPdfUrl2?: string | null;  // = oppArmyPdfUrl

  /* =========================
   * V1 – WarTracker 40k
   * ========================= */

  // 1) Identification
  playedAt?: string | null; // date jouée (ISO)
  opponent?: string | null;
  points?: number | null; // 1000 / 1500 / 2000

  // 2) Mission & table
  missionPack?: string | null;
  primaryMission?: string | null;
  deployment?: string | null;
  terrainLayout?: string | null;

  // 3) Armées
  myFaction?: string | null;
  myDetachment?: string | null;
  myArmyPdfUrl?: string | null; // Drive (toi)
  myListText?: string | null;

  oppFaction?: string | null;
  oppDetachment?: string | null;
  oppArmyPdfUrl?: string | null; // Drive (adversaire)
  oppListText?: string | null;

  // 4) Score & résultat
  myScore?: number | null;
  oppScore?: number | null;
  result?: "W" | "L" | "D" | string;

  // 5) Notes
  notes?: string | null;

  // 6) Médias (Drive)
  photoUrls?: string[];
};
