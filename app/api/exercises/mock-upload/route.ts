import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    const uploadId = searchParams.get("uploadId");

    if (!filename || !uploadId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Read file bytes from request
    const fileBuffer = Buffer.from(await request.arrayBuffer());

    // Create public/uploads/exercises directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "exercises");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, fileBuffer);

    return NextResponse.json({ success: true, url: `/uploads/exercises/${filename}` });
  } catch (error) {
    console.error("Mock exercise upload PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
