import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const filename = `${Date.now()}-${file.name}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type || undefined,
  });

  return NextResponse.json({ url: blob.url, name: file.name, type: file.type });
}
