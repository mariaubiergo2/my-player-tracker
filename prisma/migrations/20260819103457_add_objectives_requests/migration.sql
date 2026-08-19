-- CreateEnum
CREATE TYPE "ObjectivesRequestStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'RESOLVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'OBJECTIVES_REQUEST_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'OBJECTIVES_REQUEST_REPLIED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "objectives_request_id" TEXT;

-- CreateTable
CREATE TABLE "objectives_requests" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ObjectivesRequestStatus" NOT NULL DEFAULT 'PENDING',
    "trainer_reply" TEXT,
    "replied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objectives_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "objectives_requests_player_id_created_at_idx" ON "objectives_requests"("player_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "objectives_requests_trainer_id_status_created_at_idx" ON "objectives_requests"("trainer_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_objectives_request_id_idx" ON "notifications"("objectives_request_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_objectives_request_id_fkey" FOREIGN KEY ("objectives_request_id") REFERENCES "objectives_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectives_requests" ADD CONSTRAINT "objectives_requests_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectives_requests" ADD CONSTRAINT "objectives_requests_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
