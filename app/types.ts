/**
 * 🔒 DTO SAFE partagé serveur / client
 * WarTracker — v1 (Warhammer 40k)
 *
 * - Médias : liens Google Drive (optionnels)
 * - Inputs rapides : date/opponent/points + mission line + factions + score + notes
 */

export type GameDTO = {
  id: string;
  createdAt: string; // fallback / audit
  gameType: string;  // "40k" | "FaB" etc.

  // 1) Identification
  playedAt?: string | null; // date jouée (ISO)
  opponent?: string | null;
  points?: number | null; // 1000/1500/2000

  // 2) Mission & table
  missionPack?: string | null;
  primaryMission?: string | null;
  deployment?: string | null;
  terrainLayout?: string | null;

  // 3) Armées
  myFaction?: string | null;
  myDetachment?: string | null;
  myArmyPdfUrl?: string | null; // Drive (toi)
  myListText?: string | null;   // enrichissement

  oppFaction?: string | null;
  oppDetachment?: string | null;
  oppArmyPdfUrl?: string | null; // Drive (adversaire)
  oppListText?: string | null;   // enrichissement

  // 4) Score & résultat
  myScore?: number | null;
  oppScore?: number | null;
  result?: "W" | "L" | "D" | string;

  // 5) Notes
  notes?: string | null;

  // 6) Médias (Drive)
  photoUrls?: string[];
};
