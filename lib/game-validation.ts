import { z } from "zod";

const text = (max = 20_000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullish();
function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
const httpsUrl = z.preprocess(
  (value) => (typeof value === "string" && !value.trim() ? null : value),
  z
    .string()
    .trim()
    .max(2048)
    .url()
    .refine(isHttpsUrl, "Utilise un lien HTTPS.")
    .nullish(),
);
const integer = (minimum: number) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return null;
    return typeof value === "string" && value.trim() ? Number(value) : value;
  }, z.number().int().min(minimum).max(2_147_483_647).nullish());
const isoDate = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const timeline = {
  deploymentNotes: text(),
  t1Notes: text(),
  t2Notes: text(),
  t3Notes: text(),
  t4Notes: text(),
  t5Notes: text(),
  deploymentPhotoUrl: httpsUrl,
  t1PhotoUrl: httpsUrl,
  t2PhotoUrl: httpsUrl,
  t3PhotoUrl: httpsUrl,
  t4PhotoUrl: httpsUrl,
  t5PhotoUrl: httpsUrl,
};

const gameFields = z
  .object({
    gameType: z.enum(["40k", "FaB"]).default("40k"),
    build: z.string().trim().min(1).max(200).default("—"),
    opponent: z.string().trim().min(1).max(200),
    first: z.boolean().default(true),
    result: z.enum(["W", "L", "D"]),
    score: integer(-2_147_483_648),
    tag1: text(200),
    tag2: text(200),
    notes: text(),
    playedAt: isoDate.nullish(),
    points: z
      .union([z.literal(1000), z.literal(1500), z.literal(2000)])
      .nullish(),
    missionPack: text(200),
    primaryMission: text(200),
    deployment: text(200),
    terrainLayout: text(200),
    myFaction: text(200),
    myDetachment: text(200),
    oppFaction: text(200),
    oppDetachment: text(200),
    myScore: integer(0),
    oppScore: integer(0),
    myArmyPdfUrl: httpsUrl,
    oppArmyPdfUrl: httpsUrl,
    scoreSheetUrl: httpsUrl,
    myListText: text(100_000),
    oppListText: text(100_000),
    photoUrls: z
      .array(z.string().trim().max(2048).url().refine(isHttpsUrl))
      .max(100)
      .default([]),
    ...timeline,
  })
  .strict();

function validateResult(
  value: z.infer<typeof gameFields>,
  ctx: z.RefinementCtx,
) {
  if (value.gameType === "FaB" && value.build === "—")
    ctx.addIssue({
      code: "custom",
      path: ["build"],
      message: "Indique le deck joué.",
    });
  if (
    value.gameType === "40k" &&
    value.myScore != null &&
    value.oppScore != null
  ) {
    const expected =
      value.myScore === value.oppScore
        ? "D"
        : value.myScore > value.oppScore
          ? "W"
          : "L";
    if (value.result !== expected)
      ctx.addIssue({
        code: "custom",
        path: ["result"],
        message: "Le résultat doit correspondre aux scores.",
      });
  }
}

export const createGameSchema = gameFields.superRefine(validateResult);
export const importGameSchema = gameFields
  .extend({ createdAt: isoDate.optional() })
  .superRefine(validateResult);
export const patchGameSchema = z
  .object({ notes: text(), scoreSheetUrl: httpsUrl, ...timeline })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Aucune modification reçue.",
  );

const csvBoolean = z.preprocess((value) => {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  if (value === "" || value === undefined) return undefined;
  return value;
}, z.boolean().default(true));

export const csvRowSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return value;
    const row = { ...value } as Record<string, unknown>;
    if (row.first !== undefined)
      row.first =
        typeof row.first === "string"
          ? row.first.trim().toLowerCase()
          : row.first;
    for (const key of ["createdAt", "playedAt"])
      if (row[key] === "") delete row[key];
    if (typeof row.points === "string")
      row.points = row.points.trim() ? Number(row.points) : null;
    if (typeof row.photoUrls === "string")
      row.photoUrls = row.photoUrls
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean);
    return row;
  },
  gameFields
    .extend({ first: csvBoolean, createdAt: isoDate.optional() })
    .superRefine(validateResult),
);
