-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'SENT');

-- CreateEnum
CREATE TYPE "ExerciseMediaType" AS ENUM ('IMAGE', 'VIDEO_LINK');

-- CreateEnum
CREATE TYPE "RecurrenceDay" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "QuestionnaireType" AS ENUM ('ANALYSIS_VIDEO', 'PHYSICAL', 'NUTRITION');

-- CreateEnum
CREATE TYPE "ObjectiveCategory" AS ENUM ('MATCH', 'PHYSICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TRAINING_PLAN_SENT';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_FEEDBACK_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'PLAN_FEEDBACK_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'TRAINING_PLAN_UPDATED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "training_feedback_id" TEXT,
ADD COLUMN     "training_plan_assignment_id" TEXT;

-- AlterTable
ALTER TABLE "player_objectives" ADD COLUMN     "category" "ObjectiveCategory" NOT NULL DEFAULT 'MATCH';

-- AlterTable
ALTER TABLE "questionnaires" ADD COLUMN     "type" "QuestionnaireType" NOT NULL DEFAULT 'ANALYSIS_VIDEO';

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "repetitions" TEXT NOT NULL,
    "media_type" "ExerciseMediaType",
    "image_url" TEXT,
    "video_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "training_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "recurrence_days" "RecurrenceDay"[],
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_exercises" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "repetitions_override" TEXT,

    CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plan_assignments" (
    "id" TEXT NOT NULL,
    "training_plan_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_plan_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_completions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_feedbacks" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "session_id" TEXT,
    "assignment_id" TEXT,
    "comment" TEXT,
    "video_url" TEXT,
    "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercises_trainer_id_idx" ON "exercises"("trainer_id");

-- CreateIndex
CREATE INDEX "training_sessions_training_plan_id_idx" ON "training_sessions"("training_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_exercises_session_id_exercise_id_key" ON "session_exercises"("session_id", "exercise_id");

-- CreateIndex
CREATE INDEX "training_plan_assignments_player_id_idx" ON "training_plan_assignments"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_plan_assignments_training_plan_id_player_id_key" ON "training_plan_assignments"("training_plan_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_completions_session_id_player_id_scheduled_date_key" ON "session_completions"("session_id", "player_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "training_feedbacks_session_id_idx" ON "training_feedbacks"("session_id");

-- CreateIndex
CREATE INDEX "training_feedbacks_assignment_id_idx" ON "training_feedbacks"("assignment_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_training_plan_assignment_id_fkey" FOREIGN KEY ("training_plan_assignment_id") REFERENCES "training_plan_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_training_feedback_id_fkey" FOREIGN KEY ("training_feedback_id") REFERENCES "training_feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_assignments" ADD CONSTRAINT "training_plan_assignments_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_assignments" ADD CONSTRAINT "training_plan_assignments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_completions" ADD CONSTRAINT "session_completions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_completions" ADD CONSTRAINT "session_completions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_feedbacks" ADD CONSTRAINT "training_feedbacks_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_feedbacks" ADD CONSTRAINT "training_feedbacks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_feedbacks" ADD CONSTRAINT "training_feedbacks_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "training_plan_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
