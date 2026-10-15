import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { Prisma } from "@prisma/client";

test("the migration chain matches Prisma and preserves existing games and manually added list text", async () => {
  const db = new PGlite();
  try {
    const directory = resolve("prisma/migrations");
    const migrations = readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const newest = migrations.pop()!;
    for (const migration of migrations)
      await db.exec(
        readFileSync(resolve(directory, migration, "migration.sql"), "utf8"),
      );
    await db.exec(`ALTER TABLE "Game" ADD COLUMN "myListText" TEXT;`);
    const notes =
      'Old notes /*WT_TIMELINE_V1:{"t1Notes":"Old turn"}:WT_TIMELINE_V1*/';
    await db.query(
      `INSERT INTO "Game" (id, "gameType", build, opponent, result, notes, "myListText", "t1PhotoUrl") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        "existing",
        "40k",
        "List",
        "Orks",
        "W",
        notes,
        "Manually stored list",
        "https://drive.google.com/file/d/photo",
      ],
    );
    const sql = readFileSync(
      resolve(directory, newest, "migration.sql"),
      "utf8",
    );
    await db.exec(sql);
    await db.exec(sql); // Also safe after a partially/manual-applied schema change.
    const result = await db.query<Record<string, unknown>>(
      `SELECT * FROM "Game" WHERE id = 'existing'`,
    );
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].notes, notes);
    assert.equal(result.rows[0].myListText, "Manually stored list");
    assert.equal(
      result.rows[0].t1PhotoUrl,
      "https://drive.google.com/file/d/photo",
    );
    const columns = await db.query<{ column_name: string; udt_name: string }>(
      `SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = 'Game' AND table_schema = 'public'`,
    );
    const model = Prisma.dmmf.datamodel.models.find(
      (model) => model.name === "Game",
    )!;
    const expectedTypes: Record<string, string> = {
      String: "text",
      Int: "int4",
      DateTime: "timestamp",
      Boolean: "bool",
    };
    for (const field of model.fields) {
      const column = columns.rows.find(
        (column) => column.column_name === field.name,
      );
      assert.ok(column, `Migration missing ${field.name}`);
      assert.equal(
        column.udt_name,
        `${field.isList ? "_" : ""}${expectedTypes[field.type]}`,
        `Wrong SQL type for ${field.name}`,
      );
    }
  } finally {
    await db.close();
  }
});
