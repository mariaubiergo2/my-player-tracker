-- AlterTable
ALTER TABLE "matches" ALTER COLUMN "trainer_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "mux_asset_id" TEXT,
    "mux_playback_id" TEXT,
    "mux_upload_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "duration" DOUBLE PRECISION,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "videos_match_id_key" ON "videos"("match_id");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
