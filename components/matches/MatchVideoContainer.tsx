"use client";

import React, { useState, useEffect, useCallback } from "react";
import { VideoType } from "@/types/match";
import { useTranslation } from "@/components/LanguageProvider";
import VideoUpload from "./VideoUpload";
import VideoPlayer from "./VideoPlayer";

interface MatchVideoContainerProps {
  matchId: string;
  initialVideo: VideoType | null;
}

export default function MatchVideoContainer({
  matchId,
  initialVideo,
}: MatchVideoContainerProps) {
  const { t } = useTranslation();
  const [video, setVideo] = useState<VideoType | null>(initialVideo);
  const [status, setStatus] = useState<string>(initialVideo?.status || "idle");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll video status from the database
  const pollVideoStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/video`);
      if (res.ok) {
        const data = await res.json();
        if (data.video) {
          setVideo(data.video);
          setStatus(data.video.status);
          return data.video.status;
        }
      }
    } catch (err) {
      console.error("Error polling video status:", err);
    }
    return null;
  }, [matchId]);

  // Set up polling when the status is processing or uploading
  useEffect(() => {
    if (status === "processing" || status === "uploading") {
      const interval = setInterval(async () => {
        const currentStatus = await pollVideoStatus();
        if (currentStatus === "ready" || currentStatus === "errored") {
          clearInterval(interval);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [status, pollVideoStatus]);

  // Request upload URL from server
  const handleStartUpload = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/video`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initiate upload");
      }

      const data = await res.json();
      setUploadUrl(data.uploadUrl);
      setVideo(data.video);
      setStatus("uploading");
    } catch (err: any) {
      console.error("Start upload error:", err);
      setErrorMessage(err.message || t("video.error_state"));
    } finally {
      setIsLoading(false);
    }
  };

  // Triggered when file upload succeeds
  const handleUploadSuccess = async () => {
    setStatus("processing");
    setUploadProgress(100);
    // Poll immediately
    pollVideoStatus();
  };

  // Triggered when file upload fails
  const handleUploadError = (error: string) => {
    setStatus("errored");
    setErrorMessage(error);
  };

  // Delete the video asset
  const handleDeleteVideo = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/video`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete video");
      }

      setVideo(null);
      setStatus("idle");
      setUploadUrl(null);
      setUploadProgress(0);
    } catch (err: any) {
      console.error("Delete video error:", err);
      setErrorMessage(err.message || "Failed to delete video.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="alert alert-error shadow-sm rounded-lg flex items-center justify-between">
          <div className="flex gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="btn btn-ghost btn-xs text-error-content hover:bg-transparent"
          >
            ✕
          </button>
        </div>
      )}

      {status === "idle" && (
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body items-center text-center p-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <span className="text-3xl">📹</span>
            </div>
            <h2 className="card-title text-xl font-bold">
              {t("video.upload_title")}
            </h2>
            <p className="text-sm text-base-content/60 max-w-sm mt-1 mb-4">
              Add video support to this match to enable playback, player review, and technical feedback.
            </p>
            <button
              onClick={handleStartUpload}
              disabled={isLoading}
              className={`btn btn-primary gap-2 w-full max-w-xs ${
                isLoading ? "loading" : ""
              }`}
            >
              {isLoading ? t("common.loading") : t("video.upload_button")}
            </button>
          </div>
        </div>
      )}

      {status === "uploading" && uploadUrl && (
        <VideoUpload
          uploadUrl={uploadUrl}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
          onProgress={setUploadProgress}
          progress={uploadProgress}
          status={status}
          t={t}
        />
      )}

      {status === "processing" && (
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body items-center text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4" />
            <h3 className="text-lg font-semibold text-base-content">
              {t("video.processing_state")}
            </h3>
            <p className="text-sm text-base-content/60 mt-2 max-w-sm">
              Mux is transcoding your video and preparing high-quality streaming playback. This will take a minute or two.
            </p>
          </div>
        </div>
      )}

      {status === "ready" && video?.muxPlaybackId && (
        <VideoPlayer
          playbackId={video.muxPlaybackId}
          title={video.title}
          onDelete={handleDeleteVideo}
          isDeletable={true} // Verified on route-level backend
          t={t}
        />
      )}

      {status === "errored" && (
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body items-center text-center p-8">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-2">
              <span className="text-3xl text-error">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-base-content">
              {t("video.error_state")}
            </h3>
            <p className="text-sm text-base-content/60 mt-1 mb-4">
              Something went wrong during transcoding. Please try deleting the record and re-uploading.
            </p>
            <button
              onClick={handleDeleteVideo}
              disabled={isLoading}
              className={`btn btn-error btn-outline w-full max-w-xs ${
                isLoading ? "loading" : ""
              }`}
            >
              Reset Video Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
