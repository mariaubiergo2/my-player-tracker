import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || "placeholder",
  tokenSecret: process.env.MUX_TOKEN_SECRET || "placeholder",
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("mux-signature");
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: "Missing Mux Signature header" }, { status: 400 });
      }
      try {
        await mux.webhooks.verifySignature(rawBody, { "mux-signature": signature || "" }, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      console.warn("MUX_WEBHOOK_SECRET is not configured. Webhook signature verification bypassed.");
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type;
    const data = event.data;

    console.log(`Received Mux Webhook: ${eventType}`, data);

    switch (eventType) {
      case "video.upload.asset_created": {
        // data.id is the uploadId
        // data.asset_id is the created assetId
        await prisma.video.updateMany({
          where: { muxUploadId: data.id },
          data: {
            muxAssetId: data.asset_id,
            status: "processing",
          },
        });
        break;
      }

      case "video.asset.ready": {
        // data.id is the assetId
        // data.playback_ids is an array
        // data.duration is a number (float)
        const playbackId = data.playback_ids?.[0]?.id || null;
        
        // Find the video by muxAssetId
        await prisma.video.updateMany({
          where: { muxAssetId: data.id },
          data: {
            status: "ready",
            muxPlaybackId: playbackId,
            duration: data.duration || null,
          },
        });
        break;
      }

      case "video.asset.errored": {
        await prisma.video.updateMany({
          where: { muxAssetId: data.id },
          data: {
            status: "errored",
          },
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
