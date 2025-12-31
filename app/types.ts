/**
 * 🔒 DTO SAFE partagé serveur / client
 */
export type GameDTO = {
  id: string;
  createdAt: string;
  gameType: string;
  build: string;
  opponent: string;
  first: boolean;
  result: string;
  score: number | null;
  tag1: string | null;
  tag2: string | null;
  notes: string | null;

  // champs 40k éventuels
  myFaction?: string | null;
  myDetachment?: string | null;
  oppFaction?: string | null;
  oppDetachment?: string | null;
  myScore?: number | null;
  oppScore?: number | null;

  armyListPdfUrl?: string | null;
  photoUrls?: string[];

  armyListPdfUrl2?: string | null;
  scoreSheetUrl?: string | null;
};
