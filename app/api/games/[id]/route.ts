import { gameHandlers } from "@/lib/game-api";
import { gameStore } from "@/lib/game-store";

export const runtime = "nodejs";
const handlers = gameHandlers(gameStore);
type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Context) {
  return handlers.patch(req, (await params).id);
}

export async function DELETE(req: Request, { params }: Context) {
  return handlers.delete(req, (await params).id);
}
