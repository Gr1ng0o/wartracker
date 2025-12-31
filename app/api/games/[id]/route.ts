import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const body = await req.json().catch(() => ({}));

  const data: { notes?: string; armyListPdfUrl?: string | null } = {};

  if (typeof body?.notes === "string") data.notes = body.notes;
  if (typeof body?.armyListPdfUrl === "string") data.armyListPdfUrl = body.armyListPdfUrl;
  if (body?.armyListPdfUrl === null) data.armyListPdfUrl = null;

  const updated = await prisma.game.update({
    where: { id },
    data,
    select: { id: true, notes: true, armyListPdfUrl: true },
  });

  return Response.json(updated);
}
