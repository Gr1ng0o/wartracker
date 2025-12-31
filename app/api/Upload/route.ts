import { NextRequest } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) {
    return new Response("Missing file", { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return new Response("Only PDF allowed", { status: 400 });
  }

  const blob = await put(`army-lists/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return Response.json({ url: blob.url });
}
