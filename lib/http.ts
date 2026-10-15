import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function readBody(
  req: Request,
  maxBytes = 1_048_576,
): Promise<Uint8Array> {
  const length = req.headers.get("content-length");
  if (length && Number(length) > maxBytes)
    throw new HttpError(413, "Le contenu envoyé est trop volumineux.");
  if (!req.body) return new Uint8Array();
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, "Le contenu envoyé est trop volumineux.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function readJson(req: Request): Promise<unknown> {
  const text = new TextDecoder().decode(await readBody(req));
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Le contenu JSON est invalide.");
  }
}

export function apiError(error: unknown): Response {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return Response.json(
      {
        error: "Vérifie les champs saisis.",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  const code =
    error && typeof error === "object" && "code" in error
      ? error.code
      : undefined;
  if (code === "P2025")
    return Response.json({ error: "Partie introuvable." }, { status: 404 });
  console.error("[WarTracker API]", error);
  return Response.json(
    { error: "L’opération n’a pas pu être enregistrée. Réessaie plus tard." },
    { status: code === "P2022" ? 503 : 500 },
  );
}
