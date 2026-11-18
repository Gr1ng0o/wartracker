class MediaOriginError extends Error {}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || URL.parse(origin)?.host !== host) {
    throw new MediaOriginError("Origine refusée.");
  }
}

export function mediaError(error: unknown) {
  if (error instanceof MediaOriginError) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  console.error("Media operation failed", error);
  return Response.json({ error: "Opération impossible. Vérifie la configuration du stockage et de la base." }, { status: 503 });
}
