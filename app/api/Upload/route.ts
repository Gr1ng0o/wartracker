import { NextRequest } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs"; // important

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) {
    return new Response("Missing file", { status: 400 });
  }

  // sécurité: PDF only
  if (file.type !== "application/pdf") {
    return new Response("Only PDF allowed", { status: 400 });
  }

  const filename = file.name || `army-list-${Date.now()}.pdf`;

  const blob = await put(`army-lists/${filename}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return Response.json({ url: blob.url });
}
