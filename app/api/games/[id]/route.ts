export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

async function getId(params: any): Promise<string | null> {
  const resolved =
    params && typeof params.then === "function" ? await params : params;
  const id = resolved?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function isMissingColumnError(e: any) {
  return e?.code === "P2022" || String(e?.message ?? "").includes("does not exist");
}

export async function PATCH(req: Request, ctx: { params: any }) {
  const id = await getId(ctx.params);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const minimalData = {
    notes: strOrNull(body.notes),
    scoreSheetUrl: strOrNull(body.scoreSheetUrl),
  };

  const fullData = {
    ...minimalData,
    deploymentNotes: strOrNull(body.deploymentNotes),
    t1Notes: strOrNull(body.t1Notes),
    t2Notes: strOrNull(body.t2Notes),
    t3Notes: strOrNull(body.t3Notes),
    t4Notes: strOrNull(body.t4Notes),
    t5Notes: strOrNull(body.t5Notes),
  };

  try {
    const updated = await prisma.game.update({
      where: { id },
      data: fullData as any,
      select: { id: true },
    });
    return NextResponse.json({ ok: true, mode: "full", id: updated.id });
  } catch (e: any) {
    if (isMissingColumnError(e)) {
      // ✅ fallback sans colonnes timeline
      const updated2 = await prisma.game.update({
        where: { id },
        data: minimalData as any,
        select: { id: true },
      });
      return NextResponse.json({
        ok: true,
        mode: "minimal",
        id: updated2.id,
        warning: "DB non migrée: notes tour par tour non sauvegardées.",
      });
    }

    console.error("[PATCH /api/games/:id] ERROR", e);
    return NextResponse.json(
      { error: "Update failed", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
