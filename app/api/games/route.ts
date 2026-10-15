import { gameHandlers } from "@/lib/game-api";
import { gameStore } from "@/lib/game-store";

export const runtime = "nodejs";
export const POST = gameHandlers(gameStore).create;
