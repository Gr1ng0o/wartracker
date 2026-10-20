import { createHash, randomUUID } from "node:crypto";
import { requireMediaAccess, mediaError } from "@/lib/media-auth";
import { parseAlnPdf, ALN_MAX_BYTES } from "@/lib/aln-pdf";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(req: Request) { try {
    await requireMediaAccess(req);
    if (Number(req.headers.get("content-length")) > ALN_MAX_BYTES + 100000)
        return Response.json({ error: "PDF trop volumineux (4 Mo maximum)." }, { status: 413 });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > ALN_MAX_BYTES)
        return Response.json({ error: "Choisis un PDF de 4 Mo maximum." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const sourceHash = createHash("sha256").update(bytes).digest("hex");
    try {
        const roster = await parseAlnPdf(bytes);
        return Response.json({ ...roster, importKey: randomUUID(), sourceHash }, { headers: { "Cache-Control": "private, no-store" } });
    }
    catch (e) {
        return Response.json({ error: e instanceof Error ? e.message : "Impossible de lire ce PDF." }, { status: 422 });
    }
}
catch (e) {
    return mediaError(e);
} }
