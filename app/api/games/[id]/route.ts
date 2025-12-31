import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs"; // ✅ Prisma doit tourner en nodejs

const prisma = new PrismaClient();

async function getId(ctx: any): Promise<string | null> {
  const p = ctx?.params && typeof ctx.params.then === "function" ? await ctx.params : ctx?.params;
  const id = p?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function PATCH(req: Request, ctx: any) {
  try {
    const id = await getId(ctx);
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const notes = typeof body?.notes === "string" ? body.notes : null;

    const updated = await prisma.game.update({
      where: { id },
      data: { notes },
      select: { id: true, notes: true },
    });

    return Response.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/games/[id] ERROR =", e);
    return Response.json(
      { error: "Erreur serveur lors de la mise à jour", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
