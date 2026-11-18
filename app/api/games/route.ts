import { saveGame } from "@/lib/game-save";
export const runtime = "nodejs";
export async function POST(req: Request) { return saveGame(req); }
