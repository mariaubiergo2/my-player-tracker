import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import Mux from "@mux/mux-node";

// Initialize Mux SDK with credentials
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || "placeholder",
  tokenSecret: process.env.MUX_TOKEN_SECRET || "placeholder",
});

// 1. GET /api/matches/[id]/video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { video: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if the user is authorized (assigned player or trainer)
    if (match.playerId !== payload.userId && match.trainerId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let video = match.video;

    // Self-healing proactive sync (bypasses webhook requirements for localhost development)
    if (video && process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET && !video.muxPlaybackId?.startsWith("/uploads/")) {
      // 1. Sync uploading state -> checks if direct upload is completed (or if we don't have asset ID yet)
      if ((video.status === "uploading" || video.status === "processing") && video.muxUploadId && !video.muxAssetId) {
        try {
          const upload = await mux.video.uploads.retrieve(video.muxUploadId);
          if (upload && upload.status === "asset_created" && upload.asset_id) {
            video = await prisma.video.update({
              where: { matchId: id },
              data: {
                muxAssetId: upload.asset_id,
                status: "processing",
              },
            });
          } else if (upload && upload.status === "errored") {
            video = await prisma.video.update({
              where: { matchId: id },
              data: {
                status: "errored",
              },
            });
          }
        } catch (uploadError: any) {
          console.error("Proactive upload check failed, searching asset directly:", uploadError);
          if (uploadError.status === 401 || uploadError.status === 404) {
            try {
              const assets = await mux.video.assets.list({ upload_id: video.muxUploadId || undefined });
              const asset = assets.data?.[0];
              if (asset) {
                video = await prisma.video.update({
                  where: { matchId: id },
                  data: {
                    muxAssetId: asset.id,
                    status: asset.status === "ready" ? "ready" : "processing",
                    muxPlaybackId: asset.playback_ids?.[0]?.id || null,
                    duration: asset.duration || null,
                  },
                });
              }
            } catch (searchError) {
              console.error("Proactive asset search failed:", searchError);
            }
          }
        }
      }

      // 2. Sync processing state -> checks if asset is ready
      if (video.status === "processing" && video.muxAssetId) {
        try {
          const asset = await mux.video.assets.retrieve(video.muxAssetId);
          if (asset && asset.status === "ready") {
            const playbackId = asset.playback_ids?.[0]?.id || null;
            video = await prisma.video.update({
              where: { matchId: id },
              data: {
                status: "ready",
                muxPlaybackId: playbackId,
                duration: asset.duration || null,
              },
            });
          } else if (asset && asset.status === "errored") {
            video = await prisma.video.update({
              where: { matchId: id },
              data: {
                status: "errored",
              },
            });
          }
        } catch (assetError) {
          console.error("Proactive asset check failed:", assetError);
        }
      }
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error("GET match video error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 2. POST /api/matches/[id]/video
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { video: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if the user is authorized (assigned player or trainer)
    if (match.playerId !== payload.userId && match.trainerId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      console.warn("MUX_TOKEN_ID or MUX_TOKEN_SECRET is not configured. Running in Mock/Simulation Mux mode.");

      const mockUploadId = `mock_upload_${Date.now()}`;
      const video = await prisma.video.upsert({
        where: { matchId: id },
        create: {
          matchId: id,
          muxUploadId: mockUploadId,
          status: "uploading",
          title: `Simulated Video for Match: ${match.name}`,
        },
        update: {
          muxUploadId: mockUploadId,
          muxAssetId: null,
          muxPlaybackId: null,
          status: "uploading",
          duration: null,
        },
      });

      const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const uploadUrl = `${base}/api/matches/${id}/video/mock-upload?uploadId=${mockUploadId}`;
      return NextResponse.json({ uploadUrl, video });
    }

    // Create Direct Upload in Mux
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        passthrough: id,
      },
      cors_origin: "*",
    });

    // Upsert video record in the database
    const video = await prisma.video.upsert({
      where: { matchId: id },
      create: {
        matchId: id,
        muxUploadId: upload.id,
        status: "uploading",
        title: `Video for Match: ${match.name}`,
      },
      update: {
        muxUploadId: upload.id,
        muxAssetId: null,
        muxPlaybackId: null,
        status: "uploading",
        duration: null,
      },
    });

    return NextResponse.json({ uploadUrl: upload.url, video });
  } catch (error) {
    console.error("POST match video error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 3. DELETE /api/matches/[id]/video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { video: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if the user is authorized (assigned player or trainer)
    if (match.playerId !== payload.userId && match.trainerId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const video = match.video;
    if (!video) {
      return NextResponse.json({ error: "No video found for this match" }, { status: 404 });
    }

    // Delete asset from Mux
    if (video.muxAssetId && process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
      try {
        await mux.video.assets.delete(video.muxAssetId);
      } catch (muxError) {
        console.error("Failed to delete Mux asset:", muxError);
        // Continue database deletion even if Mux delete fails (e.g. if already deleted)
      }
    } else if (video.muxPlaybackId && video.muxPlaybackId.startsWith("/uploads/")) {
      // Delete local file if present
      try {
        const fs = require("fs");
        const path = require("path");
        const filePath = path.join(process.cwd(), "public", video.muxPlaybackId);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("Failed to delete local video file:", err);
      }
    }

    // Delete database video record
    await prisma.video.delete({
      where: { matchId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE match video error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
