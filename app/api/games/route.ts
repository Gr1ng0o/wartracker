import { PrismaClient } from "@prisma/client";
import type { NextRequest } from "next/server";

const prisma = new PrismaClient();

function parseNullableNumber(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * PATCH /api/games/[id]
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<any> } // ⬅️ NE PAS typer
) {
  try {
    const params = await context.params;
    const id = params.id as string; // ⬅️ cast ici

    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await req.json();

    const myScore =
      body.myScore !== undefined ? parseNullableNumber(body.myScore) : undefined;
    const oppScore =
      body.oppScore !== undefined ? parseNullableNumber(body.oppScore) : undefined;

    let result = body.result;
    if (myScore !== undefined && oppScore !== undefined) {
      if (myScore !== null && oppScore !== null) {
        result = myScore > oppScore ? "W" : "L";
      }
    }

    const updated = await prisma.game.update({
      where: { id },
      data: {
        notes: body.notes ?? undefined,
        tag1: body.tag1 ?? undefined,
        tag2: body.tag2 ?? undefined,
        myScore,
        oppScore,
        result,
      },
    });

    return Response.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/games/[id] ERROR =", e);
    return Response.json(
      { error: "Erreur serveur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/games/[id]
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<any> } // ⬅️ idem
) {
  try {
    const params = await context.params;
    const id = params.id as string;

    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.game.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/games/[id] ERROR =", e);
    return Response.json(
      { error: "Erreur serveur lors de la suppression" },
      { status: 500 }
    );
  }
}
