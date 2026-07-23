"use client";

import React from "react";
import MuxPlayer from "@mux/mux-player-react";

interface VideoPlayerProps {
  playbackId: string;
  title?: string | null;
  onDelete?: () => void;
  isDeletable?: boolean;
  t: (key: string, variables?: any) => string;
}

export default function VideoPlayer({
  playbackId,
  title,
  onDelete,
  isDeletable = false,
  t,
}: VideoPlayerProps) {
  return (
    <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-base-200 bg-base-200/50">
        <h3 className="font-semibold text-base-content flex items-center gap-2">
          <span>🎥</span> {title || t("video.upload_title")}
        </h3>
        {isDeletable && onDelete && (
          <button
            onClick={() => {
              if (window.confirm(t("video.delete_confirm"))) {
                onDelete();
              }
            }}
            className="btn btn-error btn-sm btn-outline gap-2"
          >
            {t("video.delete_button")}
          </button>
        )}
      </div>
      <div className="relative aspect-video w-full bg-black flex items-center justify-center">
        {playbackId.startsWith("/uploads/") ? (
          <video
            src={playbackId}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          />
        ) : (
          <MuxPlayer
            playbackId={playbackId}
            metadataVideoTitle={title || "Match Video"}
            streamType="on-demand"
            className="w-full h-full object-contain"
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
