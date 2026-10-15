import assert from "node:assert/strict";
import { test } from "node:test";
import { formatGameDate } from "../lib/date";

test("SSR and browser date formatting agree regardless of host timezone", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "UTC";
    const server = formatGameDate("2026-09-21T17:45:00Z");
    process.env.TZ = "Europe/Paris";
    const browser = formatGameDate("2026-09-21T17:45:00Z");
    assert.equal(server, browser);
    assert.ok(server.includes("19:45"));
    assert.ok(formatGameDate("2026-01-21T17:45:00Z").includes("18:45"));
    assert.equal(formatGameDate("invalid"), "—");
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
