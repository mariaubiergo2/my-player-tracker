import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== "TRAINER" && payload.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { filename } = body;
    if (!filename) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // Check if S3 environment variables exist
    const hasS3 =
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET &&
      process.env.S3_REGION;

    if (!hasS3) {
      // Fallback to local upload
      const mockUploadId = `mock_exercise_${Date.now()}`;
      const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
      const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uploadUrl = `${base}/api/exercises/mock-upload?uploadId=${mockUploadId}&filename=${cleanFilename}`;

      return NextResponse.json({
        uploadUrl,
        key: `/uploads/exercises/${cleanFilename}`,
        isMock: true,
      });
    }

    // Dynamic import if AWS SDK is present (in case user installs it later)
    try {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const s3 = new S3Client({
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
      });

      const key = `exercises/${Date.now()}_${filename}`;
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: "image/*",
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

      return NextResponse.json({
        uploadUrl,
        key: publicUrl,
        isMock: false,
      });
    } catch (s3Error) {
      console.error("Failed to generate presigned S3 URL, falling back to mock upload", s3Error);
      const mockUploadId = `mock_exercise_${Date.now()}`;
      const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
      const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uploadUrl = `${base}/api/exercises/mock-upload?uploadId=${mockUploadId}&filename=${cleanFilename}`;

      return NextResponse.json({
        uploadUrl,
        key: `/uploads/exercises/${cleanFilename}`,
        isMock: true,
      });
    }
  } catch (error) {
    console.error("POST exercises upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
