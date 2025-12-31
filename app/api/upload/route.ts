import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing or invalid file" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const blob = await put(`army-lists/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      size: file.size,
      name: file.name,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR", err);

    return NextResponse.json(
      {
        error: "Upload failed",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
