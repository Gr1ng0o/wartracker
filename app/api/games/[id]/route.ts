import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const updated = await prisma.game.update({
    where: { id: params.id },
    data: {
      notes: body.notes ?? null,
      build: body.build ?? undefined,
      opponent: body.opponent ?? undefined,
      playerFaction: body.playerFaction ?? undefined,
      playerDetachment: body.playerDetachment ?? undefined,
      opponentFaction: body.opponentFaction ?? undefined,
      opponentDetachment: body.opponentDetachment ?? undefined,
      scoreFor: body.scoreFor === "" ? null : body.scoreFor ?? undefined,
      scoreAgainst: body.scoreAgainst === "" ? null : body.scoreAgainst ?? undefined,
      result: body.result ?? undefined,
    },
    include: { attachments: true },
  });

  return Response.json(updated);
}
