import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { gameHandlers, type GameStore } from "../lib/game-api";

const databaseUrl = process.env.TEST_DATABASE_URL;

test(
  "PostgreSQL round-trip: metadata, photos, partial updates and CSV import",
  { skip: !databaseUrl },
  async () => {
    const db = new PrismaClient({ datasourceUrl: databaseUrl });
    const previousKey = process.env.ADMIN_KEY;
    const key = "local-postgres-test-key-at-least-32-characters";
    process.env.ADMIN_KEY = key;
    const opponent = `wartracker-test-${randomUUID()}`;
    const store: GameStore = {
      create: (data) => db.game.create({ data }),
      update: (id, data) => db.game.update({ where: { id }, data }),
      delete: (id) => db.game.delete({ where: { id } }),
      createMany: (data) => db.game.createMany({ data }),
    };
    const handlers = gameHandlers(store);
    const request = (method: string, data: unknown) =>
      new Request("https://local.test/api/games", {
        method,
        headers: { "x-admin-key": key, "content-type": "application/json" },
        body: JSON.stringify(data),
      });
    try {
      const created = await handlers.create(
        request("POST", {
          opponent,
          gameType: "40k",
          result: "W",
          myScore: 80,
          oppScore: 60,
          points: 1500,
          playedAt: "2026-01-01T10:00:00Z",
          primaryMission: "Test mission",
          myListText: "My list",
          oppListText: "Other list",
          t1PhotoUrl: "https://drive.google.com/file/d/photo",
          t1Notes: "Turn one",
        }),
      );
      assert.equal(created.status, 201);
      const { id } = await created.json();
      assert.equal(
        (await handlers.patch(request("PATCH", { notes: "Debrief" }), id))
          .status,
        200,
      );
      const game = await db.game.findUniqueOrThrow({ where: { id } });
      assert.equal(game.playedAt?.toISOString(), "2026-01-01T10:00:00.000Z");
      assert.equal(game.points, 1500);
      assert.equal(game.primaryMission, "Test mission");
      assert.equal(game.myListText, "My list");
      assert.equal(game.oppListText, "Other list");
      assert.equal(game.t1PhotoUrl, "https://drive.google.com/file/d/photo");
      assert.equal(game.t1Notes, "Turn one");
      assert.equal(game.notes, "Debrief");
      const form = new FormData();
      form.set(
        "file",
        new File(
          [
            `gameType,build,opponent,first,result,score\nFaB,Enigma,${opponent},false,L,2`,
          ],
          "test.csv",
        ),
      );
      assert.equal(
        (
          await handlers.importCsv(
            new Request("https://local.test/api/import/csv", {
              method: "POST",
              headers: { "x-admin-key": key },
              body: form,
            }),
          )
        ).status,
        200,
      );
      const fab = await db.game.findFirstOrThrow({
        where: { opponent, gameType: "FaB" },
      });
      assert.equal(fab.first, false);
      assert.equal(fab.score, 2);
      assert.equal(
        (
          await handlers.delete(
            new Request("https://local.test/api/games", {
              method: "DELETE",
              headers: { "x-admin-key": key },
            }),
            id,
          )
        ).status,
        200,
      );
      assert.equal(await db.game.findUnique({ where: { id } }), null);
    } finally {
      try {
        await db.game.deleteMany({ where: { opponent } });
      } finally {
        await db.$disconnect();
        if (previousKey === undefined) delete process.env.ADMIN_KEY;
        else process.env.ADMIN_KEY = previousKey;
      }
    }
  },
);
