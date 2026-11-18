import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveGame } from "@/lib/game-save";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
async function getId(params: Promise<{id:string}>) { return (await params).id; }
export async function PATCH(req: Request, ctx: { params: Promise<{id:string}> }) { return saveGame(req, await getId(ctx.params)); }
export async function DELETE(_: Request, ctx: { params: any }) {
  const id = await getId(ctx.params);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const deleted = await prisma.game.delete({
      where: { id },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (e: any) {
    console.error("[DELETE /api/games/:id] ERROR", e);
    return NextResponse.json(
      { error: "Delete failed", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
