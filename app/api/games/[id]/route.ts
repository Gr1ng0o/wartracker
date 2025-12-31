import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const body = await req.json().catch(() => ({}));
  const notes = typeof body?.notes === "string" ? body.notes : "";

  const updated = await prisma.game.update({
    where: { id },
    data: { notes },
    select: { id: true, notes: true },
  });

  return Response.json(updated);
}
