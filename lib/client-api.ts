export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Une erreur est survenue. Réessaie.";
}

export async function apiRequest(
  path: string,
  init: RequestInit,
): Promise<unknown> {
  const response = await fetch(path, init);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    let message =
      response.status === 401
        ? "Reconnecte-toi pour continuer."
        : "L’opération a échoué. Réessaie.";
    if (
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
    )
      message = payload.error;
    throw new Error(message);
  }
  return payload;
}
