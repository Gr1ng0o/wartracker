import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const notes = typeof body?.notes === "string" ? body.notes : "";

  const updated = await prisma.game.update({
    where: { id: params.id },
    data: { notes },
    select: { id: true, notes: true },
  });

  return Response.json(updated);
}
