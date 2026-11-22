import { getDocumentProxy } from "unpdf";
import { parseAlnText } from "./aln-parser";
export const ALN_MAX_BYTES = 4 * 1024 * 1024;
export async function parseAlnPdf(data: Uint8Array) {
    if (data.length > ALN_MAX_BYTES)
        throw new Error("PDF trop volumineux : 4 Mo maximum.");
    if (!new TextDecoder().decode(data.subarray(0, 1024)).includes("%PDF-"))
        throw new Error("Le fichier n’est pas un PDF.");
    const pdf = await getDocumentProxy(data, { useSystemFonts: false });
    try {
        if (pdf.numPages > 40)
            throw new Error("PDF trop long : 40 pages maximum.");
        const pages: string[] = [];
        let characters = 0;
        for (let n = 1; n <= pdf.numPages; n++) {
            const page = await pdf.getPage(n), content = await page.getTextContent();
            const rows: {
                y: number;
                parts: {
                    x: number;
                    text: string;
                }[];
            }[] = [];
            for (const item of content.items) {
                if (!("str" in item) || !item.str.trim())
                    continue;
                const y = item.transform[5];
                let row = rows.find(r => Math.abs(r.y - y) < 3.5);
                if (!row) {
                    row = { y, parts: [] };
                    rows.push(row);
                }
                row.parts.push({ x: item.transform[4], text: item.str });
                characters += item.str.length;
                if (characters > 1000000)
                    throw new Error("Trop de texte dans ce PDF.");
            }
            pages.push(rows.sort((a, b) => b.y - a.y).map(r => r.parts.sort((a, b) => a.x - b.x).map(p => p.text).join(" ")).join("\n"));
            page.cleanup();
        }
        return parseAlnText(pages.join("\n"));
    }
    finally {
        await pdf.loadingTask.destroy();
    }
}
