import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import Papa from "papaparse";

const prisma = new PrismaClient();

// (Optionnel mais conseillé) petite protection
function assertAuthorized(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) {
    throw new Error("Unauthorized");
  }
}

// Schéma attendu par ligne CSV
const RowSchema = z.object({
  gameType: z.enum(["40k", "FaB"]).default("40k"),
  build: z.string().min(1),
  opponent: z.string().min(1),
  first: z.coerce.boolean().default(true),
  result: z.enum(["W", "L"]),
  score: z.string().optional().default(""),
  tag1: z.string().optional().default(""),
  tag2: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  // optionnel : pour importer une date
  createdAt: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    assertAuthorized(req);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "Missing file" }, { status: 400 });
    }

    const text = await file.text();

    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors?.length) {
      return Response.json(
        { ok: false, error: "CSV parse error", details: parsed.errors },
        { status: 400 }
      );
    }

    const rowsRaw = parsed.data ?? [];

    const rowsValidated: any[] = [];
    const errors: Array<{ index: number; message: string }> = [];

    rowsRaw.forEach((r, i) => {
      const res = RowSchema.safeParse(r);
      if (!res.success) {
        errors.push({ index: i, message: res.error.issues.map(x => x.message).join(", ") });
        return;
      }
      const v = res.data;

      rowsValidated.push({
        gameType: v.gameType,
        build: v.build,
        opponent: v.opponent,
        first: v.first,
        result: v.result,
        score: v.score ?? "",
        tag1: v.tag1 ?? "",
        tag2: v.tag2 ?? "",
        notes: v.notes ?? "",
        ...(v.createdAt ? { createdAt: new Date(v.createdAt) } : {}),
      });
    });

    if (errors.length) {
      return Response.json({ ok: false, error: "Validation errors", errors }, { status: 400 });
    }

    // Insert en bulk (rapide)
    await prisma.game.createMany({
      data: rowsValidated,
      skipDuplicates: false,
    });

    return Response.json({ ok: true, inserted: rowsValidated.length });
  } catch (e: any) {
    const msg = e?.message ?? "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return Response.json({ ok: false, error: msg }, { status });
  }
}
