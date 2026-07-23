"use client";

import React, { useRef } from "react";
import MuxUploader from "@mux/mux-uploader-react";

interface VideoUploadProps {
  uploadUrl: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onProgress: (progress: number) => void;
  progress: number;
  status: string;
  t: (key: string, variables?: any) => string;
}

export default function VideoUpload({
  uploadUrl,
  onSuccess,
  onError,
  onProgress,
  progress,
  status,
  t,
}: VideoUploadProps) {
  const uploaderRef = useRef<any>(null);

  const handleUploadStart = () => {
    onProgress(0);
  };

  const handleProgress = (event: any) => {
    if (event.detail !== undefined) {
      onProgress(Math.round(event.detail));
    }
  };

  const handleSuccess = () => {
    onSuccess();
  };

  const handleUploaderError = (event: any) => {
    console.error("Mux Uploader Error:", event);
    onError(event.detail?.message || t("video.error_state"));
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-base-300 rounded-xl bg-base-100/50 hover:bg-base-100 transition-all duration-300">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-base-content">
            {t("video.upload_title")}
          </h3>
          <p className="text-sm text-base-content/60 mt-1">
            {t("match_form.description_placeholder")}
          </p>
        </div>

        {status === "uploading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-primary">
                {t("video.uploading_state", { progress })}
              </span>
              <span>{progress}%</span>
            </div>
            <progress
              className="progress progress-primary w-full h-2 rounded-full transition-all duration-200"
              value={progress}
              max="100"
            />
          </div>
        )}

        <div className={status === "uploading" ? "hidden" : "block"}>
          <MuxUploader
            ref={uploaderRef}
            endpoint={uploadUrl}
            onUploadStart={handleUploadStart}
            onProgress={handleProgress}
            onSuccess={handleSuccess}
            onError={handleUploaderError}
            style={{
              display: "block",
              width: "100%",
              // Style the custom Mux web component variables
              "--background-color": "var(--color-base-200, var(--fallback-b2, #f2f2f2))",
              "--border-radius": "0.5rem",
              "--button-background-color": "var(--color-primary, var(--fallback-p, #4f46e5))",
              "--button-text-color": "var(--color-primary-content, #ffffff)",
              "--progress-bar-color": "var(--color-primary, var(--fallback-p, #4f46e5))",
            } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}
