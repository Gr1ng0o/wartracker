import { PrismaClient } from "@prisma/client";
import type { NextRequest } from "next/server";

const prisma = new PrismaClient();

/**
 * DELETE /api/games/[id]
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<any> }
) {
  try {
    const params = await context.params;
    const id = params?.id;

    console.log("DELETE game id =", id);

    if (!id || typeof id !== "string") {
      return Response.json(
        { error: "Invalid or missing id" },
        { status: 400 }
      );
    }

    await prisma.game.delete({
      where: { id },
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error("DELETE /api/games/[id] ERROR =", e);

    return Response.json(
      {
        error: "Erreur lors de la suppression",
        details: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
