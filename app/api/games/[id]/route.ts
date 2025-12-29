import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Ctx =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await (ctx as any).params; // support params Promise ou object
  const body = await req.json();

  const updated = await prisma.game.update({
    where: { id },
    data: {
      notes: typeof body.notes === "string" ? body.notes : undefined,
      // Tu peux autoriser d'autres champs plus tard si tu veux
    },
  });

  return Response.json(updated);
}
