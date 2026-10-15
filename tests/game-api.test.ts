import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import type { Prisma } from "@prisma/client";
import { gameHandlers, type GameStore } from "../lib/game-api";

const key = "local-test-key-with-at-least-32-characters";
const previousKey = process.env.ADMIN_KEY;
beforeEach(() => {
  process.env.ADMIN_KEY = key;
});
afterEach(() => {
  if (previousKey === undefined) delete process.env.ADMIN_KEY;
  else process.env.ADMIN_KEY = previousKey;
});

function fixture() {
  const records = new Map<string, Record<string, unknown>>();
  let nextId = 0;
  function create(data: Prisma.GameCreateInput | Prisma.GameCreateManyInput) {
    const id = `game-${++nextId}`;
    records.set(id, { ...data, id });
    return { id };
  }
  const store: GameStore = {
    async create(data) {
      return create(data);
    },
    async update(id, data) {
      const record = records.get(id);
      if (!record) throw Object.assign(new Error("Missing"), { code: "P2025" });
      Object.assign(record, data);
      return { id };
    },
    async delete(id) {
      if (!records.delete(id))
        throw Object.assign(new Error("Missing"), { code: "P2025" });
      return { id };
    },
    async createMany(data) {
      data.forEach(create);
      return { count: data.length };
    },
  };
  return { records, store, handlers: gameHandlers(store) };
}

function jsonRequest(method: string, data: unknown, authorized = true) {
  return new Request("https://local.test/api/games", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authorized ? { "x-admin-key": key } : {}),
    },
    body: JSON.stringify(data),
  });
}

function csvRequest(csv: string, authorized = true) {
  const form = new FormData();
  form.set("file", new File([csv], "test.csv", { type: "text/csv" }));
  return new Request("https://local.test/api/import/csv", {
    method: "POST",
    headers: authorized ? { "x-admin-key": key } : {},
    body: form,
  });
}

const photoFields = [
  "deploymentPhotoUrl",
  "t1PhotoUrl",
  "t2PhotoUrl",
  "t3PhotoUrl",
  "t4PhotoUrl",
  "t5PhotoUrl",
];

test("creation persists every 40k metadata field and both army lists", async () => {
  const { handlers, records } = fixture();
  const payload = {
    gameType: "40k",
    opponent: "Orks",
    result: "W",
    myScore: 80,
    oppScore: 60,
    playedAt: "2026-01-01T10:00:00Z",
    points: 1500,
    missionPack: "Pack",
    primaryMission: "Mission",
    deployment: "Deployment",
    terrainLayout: "Layout",
    myListText: "My list",
    oppListText: "Opponent list",
  };
  const response = await handlers.create(jsonRequest("POST", payload));
  assert.equal(response.status, 201);
  const [game] = records.values();
  assert.equal(
    (game.playedAt as Date).toISOString(),
    new Date(payload.playedAt).toISOString(),
  );
  for (const field of [
    "points",
    "missionPack",
    "primaryMission",
    "deployment",
    "terrainLayout",
    "myListText",
    "oppListText",
  ] as const)
    assert.equal(game[field], payload[field]);
});

test("saving notes preserves all six photo links, score sheet and omitted turn notes", async () => {
  const { handlers, records } = fixture();
  const photos = Object.fromEntries(
    photoFields.map((field) => [
      field,
      `https://drive.google.com/file/d/${field}`,
    ]),
  );
  const response = await handlers.create(
    jsonRequest("POST", {
      opponent: "Orks",
      result: "W",
      ...photos,
      t1Notes: "Existing turn notes",
      scoreSheetUrl: "https://drive.google.com/file/d/score",
    }),
  );
  const { id } = await response.json();
  assert.equal(
    (await handlers.patch(jsonRequest("PATCH", { notes: "New notes" }), id))
      .status,
    200,
  );
  const game = records.get(id)!;
  for (const field of photoFields) assert.equal(game[field], photos[field]);
  assert.equal(game.t1Notes, "Existing turn notes");
  assert.equal(game.scoreSheetUrl, "https://drive.google.com/file/d/score");
  assert.equal(
    (await handlers.patch(jsonRequest("PATCH", { t1PhotoUrl: null }), id))
      .status,
    200,
  );
  assert.equal(game.t1PhotoUrl, null);
  assert.equal(game.t2PhotoUrl, photos.t2PhotoUrl);
});

test("malformed, unknown and inconsistent input is rejected before persistence", async () => {
  const { handlers, records } = fixture();
  for (const extra of [
    { result: "invalid" },
    { gameType: "unknown" },
    { myScore: -1 },
    { myScore: 1.5 },
    { myScore: 10, oppScore: 20 },
    { scoreSheetUrl: "javascript:alert(1)" },
    { scoreSheetUrl: "not a URL" },
    { photoUrls: ["invalid"] },
    { unknownField: "ignored?" },
    { opponent: {} },
  ]) {
    assert.equal(
      (
        await handlers.create(
          jsonRequest("POST", { opponent: "Orks", result: "W", ...extra }),
        )
      ).status,
      400,
    );
  }
  assert.equal(
    (await handlers.patch(jsonRequest("PATCH", {}), "missing")).status,
    400,
  );
  const broken = new Request("https://local.test/api/games", {
    method: "POST",
    headers: { "x-admin-key": key },
    body: "{",
  });
  assert.equal((await handlers.create(broken)).status, 400);
  assert.equal(records.size, 0);
});

test("all mutation handlers reject unauthenticated requests without touching the store", async () => {
  const { handlers, records } = fixture();
  assert.equal(
    (
      await handlers.create(
        jsonRequest("POST", { opponent: "Orks", result: "W" }, false),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handlers.patch(
        jsonRequest("PATCH", { notes: "bad" }, false),
        "existing",
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handlers.delete(
        new Request("https://local.test/api/games", { method: "DELETE" }),
        "existing",
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handlers.importCsv(
        csvRequest("gameType,build,opponent,result\nFaB,Enigma,Bravo,W", false),
      )
    ).status,
    401,
  );
  assert.equal(records.size, 0);
});

test("CSV preserves false, parses signed integers and accepts draws and empty dates", async () => {
  const { handlers, records } = fixture();
  const csv =
    "gameType,build,opponent,first,result,score,createdAt\nFaB,Enigma,Bravo,false,L,2,2026-01-01T10:00:00Z\n40k,Ultramarines,Orks,true,D,-12,\n";
  const response = await handlers.importCsv(csvRequest(csv));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).inserted, 2);
  const [first, second] = [...records.values()];
  assert.equal(first.first, false);
  assert.equal(first.score, 2);
  assert.equal(
    (first.createdAt as Date).toISOString(),
    "2026-01-01T10:00:00.000Z",
  );
  assert.equal(second.first, true);
  assert.equal(second.score, -12);
  assert.equal(second.result, "D");
});

test("an invalid CSV row prevents the entire import", async () => {
  const { handlers, records } = fixture();
  for (const invalid of [
    "maybe,W,2,",
    "false,W,2.5,",
    "false,W,2,not-a-date",
  ]) {
    const response = await handlers.importCsv(
      csvRequest(
        `gameType,build,opponent,first,result,score,createdAt\nFaB,Enigma,Bravo,true,W,2,\nFaB,Enigma,Bravo,${invalid}`,
      ),
    );
    assert.equal(response.status, 400);
    assert.equal(records.size, 0);
  }
});

test("missing schema columns return failure instead of retrying with data removed", async (context) => {
  context.mock.method(console, "error", () => {});
  const { store } = fixture();
  let calls = 0;
  store.create = async () => {
    calls++;
    throw Object.assign(new Error("Internal database details"), {
      code: "P2022",
    });
  };
  const response = await gameHandlers(store).create(
    jsonRequest("POST", {
      opponent: "Orks",
      result: "W",
      myListText: "Never discard this",
    }),
  );
  assert.equal(response.status, 503);
  assert.equal(calls, 1);
  assert.equal(
    (await response.text()).includes("Internal database details"),
    false,
  );
});

test("missing records return 404 and oversized bodies return 413", async () => {
  const { handlers } = fixture();
  assert.equal(
    (await handlers.patch(jsonRequest("PATCH", { notes: "notes" }), "missing"))
      .status,
    404,
  );
  assert.equal(
    (
      await handlers.delete(
        new Request("https://local.test/api/games", {
          method: "DELETE",
          headers: { "x-admin-key": key },
        }),
        "missing",
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await handlers.create(
        jsonRequest("POST", {
          opponent: "Orks",
          result: "W",
          notes: "a".repeat(1_048_576),
        }),
      )
    ).status,
    413,
  );
});
