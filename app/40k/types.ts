/**
 * 🔒 DTO SAFE partagé serveur / client
 * WarTracker — Warhammer 40k
 *
 * ⚠️ Important :
 * - `notes` = Notes post-partie globales
 * - `deploymentNotes / t1Notes / ...` = REMARQUES / AJUSTEMENTS (timeline)
 */
export type GameDTO = {
  /* =========================
   * Identité
   * ========================= */
  id: string;
  createdAt: string;
  gameType: string; // "40k" | "FaB"

  /* =========================
   * Legacy (à garder)
   * ========================= */
  build?: string;
  first?: boolean;
  score?: number | null;
  tag1?: string | null;
  tag2?: string | null;

  // legacy PDF aliases (anciennes pages)
  armyListPdfUrl?: string | null;
  armyListPdfUrl2?: string | null;

  /* =========================
   * V1 – Infos game
   * ========================= */
  playedAt?: string | null;
  opponent?: string | null;
  points?: number | null;

  missionPack?: string | null;
  primaryMission?: string | null;
  deployment?: string | null;
  terrainLayout?: string | null;

  /* =========================
   * Armées
   * ========================= */
  myFaction?: string | null;
  myDetachment?: string | null;
  myArmyPdfUrl?: string | null;
  myListText?: string | null;

  oppFaction?: string | null;
  oppDetachment?: string | null;
  oppArmyPdfUrl?: string | null;
  oppListText?: string | null;

  /* =========================
   * Score
   * ========================= */
  scoreSheetUrl?: string | null;

  myScore?: number | null;
  oppScore?: number | null;
  result?: "W" | "L" | "D" | string;

  /* =========================
   * Notes globales
   * ========================= */
  notes?: string | null; // ❗ Notes POST-PARTIE uniquement

  /* =========================
   * Médias généraux
   * ========================= */
  photoUrls?: string[];

  /* =========================
   * Timeline – Photos
   * ========================= */
  deploymentPhotoUrl?: string | null;
  t1PhotoUrl?: string | null;
  t2PhotoUrl?: string | null;
  t3PhotoUrl?: string | null;
  t4PhotoUrl?: string | null;
  t5PhotoUrl?: string | null;

  /* =========================
   * Timeline – REMARQUES / AJUSTEMENTS
   * ========================= */
  deploymentNotes?: string | null;
  t1Notes?: string | null;
  t2Notes?: string | null;
  t3Notes?: string | null;
  t4Notes?: string | null;
  t5Notes?: string | null;
};
