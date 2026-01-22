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
  const resolved = params && typeof params.then === "function" ? await params : params;
  const id = resolved?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function isMissingColumnError(e: any) {
  const msg = String(e?.message ?? "");
  return e?.code === "P2022" || msg.includes("does not exist");
}

function stripTimeline(data: Record<string, any>) {
  // ✅ retire uniquement timeline (photos + notes tour par tour)
  const {
    deploymentPhotoUrl,
    t1PhotoUrl,
    t2PhotoUrl,
    t3PhotoUrl,
    t4PhotoUrl,
    t5PhotoUrl,
    deploymentNotes,
    t1Notes,
    t2Notes,
    t3Notes,
    t4Notes,
    t5Notes,
    ...rest
  } = data;
  return rest;
}

/**
 * ✅ PATCH — met à jour:
 * - notes post-partie (notes)
 * - scoreSheetUrl
 * - timeline notes (deploymentNotes, t1Notes..t5Notes)
 *
 * Stratégie:
 * 1) try fullData
 * 2) si DB pas migrée -> retry en retirant UNIQUEMENT les champs timeline
 *    (on ne retombe pas sur un minimalData qui “perd” des infos si seules certaines colonnes manquent)
 */
export async function PATCH(req: Request, ctx: { params: any }) {
  const id = await getId(ctx.params);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fullData: Record<string, any> = {
    // global
    notes: strOrNull(body.notes),
    scoreSheetUrl: strOrNull(body.scoreSheetUrl),

    // timeline notes
    deploymentNotes: strOrNull(body.deploymentNotes),
    t1Notes: strOrNull(body.t1Notes),
    t2Notes: strOrNull(body.t2Notes),
    t3Notes: strOrNull(body.t3Notes),
    t4Notes: strOrNull(body.t4Notes),
    t5Notes: strOrNull(body.t5Notes),

    // (si jamais ton client envoie des photos plus tard, on est compatible)
    deploymentPhotoUrl: strOrNull(body.deploymentPhotoUrl),
    t1PhotoUrl: strOrNull(body.t1PhotoUrl),
    t2PhotoUrl: strOrNull(body.t2PhotoUrl),
    t3PhotoUrl: strOrNull(body.t3PhotoUrl),
    t4PhotoUrl: strOrNull(body.t4PhotoUrl),
    t5PhotoUrl: strOrNull(body.t5PhotoUrl),
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
      // ✅ retry: on garde notes + scoreSheetUrl, on retire seulement timeline
      const retryData = stripTimeline(fullData);

      try {
        const updated2 = await prisma.game.update({
          where: { id },
          data: retryData as any,
          select: { id: true },
        });

        return NextResponse.json({
          ok: true,
          mode: "no-timeline",
          id: updated2.id,
          warning:
            "Colonnes timeline absentes côté DB/Prisma: seules notes + score sheet ont été sauvegardées.",
        });
      } catch (e2: any) {
        console.error("[PATCH /api/games/:id] RETRY ERROR", e2);
        return NextResponse.json(
          { error: "Update failed (retry)", details: String(e2?.message ?? e2) },
          { status: 500 }
        );
      }
    }

    console.error("[PATCH /api/games/:id] ERROR", e);
    return NextResponse.json(
      { error: "Update failed", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
