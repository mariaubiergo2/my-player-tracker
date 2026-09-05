/*
  Warnings:

  - You are about to drop the column `objectives_request_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `objectives_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "QuickResponseType" AS ENUM ('LOOKING_INTO_IT', 'WORKING_ON_IT', 'WILL_DISCUSS_NEXT_SESSION', 'NEW_OBJECTIVES_COMING');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PLAYER_UNASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'OBJECTIVES_DEFINED';

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_objectives_request_id_fkey";

-- DropForeignKey
ALTER TABLE "objectives_requests" DROP CONSTRAINT "objectives_requests_player_id_fkey";

-- DropForeignKey
ALTER TABLE "objectives_requests" DROP CONSTRAINT "objectives_requests_trainer_id_fkey";

-- DropIndex
DROP INDEX "notifications_objectives_request_id_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "objectives_request_id",
ADD COLUMN     "objective_request_id" TEXT,
ADD COLUMN     "player_objectives_id" TEXT,
ADD COLUMN     "unassigned_player_id" TEXT;

-- DropTable
DROP TABLE "objectives_requests";

-- DropEnum
DROP TYPE "ObjectivesRequestStatus";

-- CreateTable
CREATE TABLE "objective_requests" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "type" "QuestionnaireType" NOT NULL DEFAULT 'ANALYSIS_VIDEO',
    "reason" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objective_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objective_request_responses" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "quick_response_type" "QuickResponseType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objective_request_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "objective_requests_player_id_created_at_idx" ON "objective_requests"("player_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "objective_request_responses_request_id_idx" ON "objective_request_responses"("request_id");

-- CreateIndex
CREATE INDEX "notifications_objective_request_id_idx" ON "notifications"("objective_request_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_objective_request_id_fkey" FOREIGN KEY ("objective_request_id") REFERENCES "objective_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_unassigned_player_id_fkey" FOREIGN KEY ("unassigned_player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_player_objectives_id_fkey" FOREIGN KEY ("player_objectives_id") REFERENCES "player_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_requests" ADD CONSTRAINT "objective_requests_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_request_responses" ADD CONSTRAINT "objective_request_responses_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "objective_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_request_responses" ADD CONSTRAINT "objective_request_responses_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
