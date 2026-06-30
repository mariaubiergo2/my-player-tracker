import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
      return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });
    }

    // 1. Read file bytes from request
    const fileBuffer = Buffer.from(await request.arrayBuffer());

    // 2. Create public/uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 3. Save file to disk
    const fileName = `match_${id}_video.mp4`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);

    // 4. Update the database record pointing to the local video URL
    const localVideoUrl = `/uploads/${fileName}`;

    await prisma.video.updateMany({
      where: { muxUploadId: uploadId },
      data: {
        status: "ready",
        muxAssetId: `local_asset_${Date.now()}`,
        muxPlaybackId: localVideoUrl,
        duration: 0,
      },
    });

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Mock upload PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
