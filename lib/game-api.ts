import type { Prisma } from "@prisma/client";
import Papa from "papaparse";
import { authorizeApi } from "./auth";
import { apiError, HttpError, readBody, readJson } from "./http";
import {
  createGameSchema,
  csvRowSchema,
  patchGameSchema,
} from "./game-validation";

export interface GameStore {
  create(data: Prisma.GameCreateInput): Promise<{ id: string }>;
  update(id: string, data: Prisma.GameUpdateInput): Promise<{ id: string }>;
  delete(id: string): Promise<{ id: string }>;
  createMany(data: Prisma.GameCreateManyInput[]): Promise<{ count: number }>;
}

export function gameHandlers(store: GameStore) {
  return {
    async create(req: Request) {
      const denied = authorizeApi(req);
      if (denied) return denied;
      try {
        const data = createGameSchema.parse(await readJson(req));
        return Response.json(await store.create(data), { status: 201 });
      } catch (error) {
        return apiError(error);
      }
    },
    async patch(req: Request, id: string) {
      const denied = authorizeApi(req);
      if (denied) return denied;
      if (!id)
        return Response.json(
          { error: "Identifiant invalide." },
          { status: 400 },
        );
      try {
        const data = patchGameSchema.parse(await readJson(req));
        const game = await store.update(id, data);
        return Response.json({ ok: true, id: game.id });
      } catch (error) {
        return apiError(error);
      }
    },
    async delete(req: Request, id: string) {
      const denied = authorizeApi(req);
      if (denied) return denied;
      if (!id)
        return Response.json(
          { error: "Identifiant invalide." },
          { status: 400 },
        );
      try {
        const game = await store.delete(id);
        return Response.json({ ok: true, id: game.id });
      } catch (error) {
        return apiError(error);
      }
    },
    async importCsv(req: Request) {
      const denied = authorizeApi(req);
      if (denied) return denied;
      try {
        const body = await readBody(req, 2_097_152);
        let formData: FormData;
        try {
          formData = await new Request(req.url, {
            method: "POST",
            headers: req.headers,
            body: Buffer.from(body),
          }).formData();
        } catch {
          throw new HttpError(400, "Le formulaire envoyé est invalide.");
        }
        const file = formData.get("file");
        if (!(file instanceof File))
          throw new HttpError(400, "Choisis un fichier CSV.");
        const parsed = Papa.parse<Record<string, unknown>>(await file.text(), {
          header: true,
          skipEmptyLines: "greedy",
          transformHeader: (header) => header.trim(),
        });
        if (parsed.errors.length)
          throw new HttpError(400, "Le format CSV est invalide.");
        if (!parsed.data.length || parsed.data.length > 5000)
          throw new HttpError(
            400,
            "Le CSV doit contenir entre 1 et 5 000 parties.",
          );
        const rows: Prisma.GameCreateManyInput[] = [];
        for (let index = 0; index < parsed.data.length; index++) {
          const row = csvRowSchema.safeParse(parsed.data[index]);
          if (!row.success)
            return Response.json(
              {
                error: `Ligne ${index + 2} : vérifie les valeurs.`,
                issues: row.error.issues.map((issue) => ({
                  path: issue.path.join("."),
                  message: issue.message,
                })),
              },
              { status: 400 },
            );
          rows.push(row.data);
        }
        const inserted = await store.createMany(rows);
        return Response.json({ ok: true, inserted: inserted.count });
      } catch (error) {
        return apiError(error);
      }
    },
  };
}
