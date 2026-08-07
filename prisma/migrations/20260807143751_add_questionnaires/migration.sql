/*
  Warnings:

  - You are about to drop the column `trainer_id` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('DRAFT', 'DEFINED', 'SEND');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('SENT', 'RECLAIMED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'OPEN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'QUESTIONNAIRE_SENT';
ALTER TYPE "NotificationType" ADD VALUE 'QUESTIONNAIRE_RESPONDED';
ALTER TYPE "NotificationType" ADD VALUE 'QUESTIONNAIRE_RECLAIMED';

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_trainer_id_fkey";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "assignment_id" TEXT,
ALTER COLUMN "match_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "trainer_id";

-- CreateTable
CREATE TABLE "questionnaires" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "QuestionnaireStatus" NOT NULL DEFAULT 'DRAFT',
    "trainer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "questionnaire_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "options" TEXT[],
    "order" INTEGER NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_assignments" (
    "id" TEXT NOT NULL,
    "questionnaire_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'SENT',
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reclaimed_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "questionnaire_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TrainerPlayers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TrainerPlayers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "questionnaires_trainer_id_idx" ON "questionnaires"("trainer_id");

-- CreateIndex
CREATE INDEX "questions_questionnaire_id_idx" ON "questions"("questionnaire_id");

-- CreateIndex
CREATE INDEX "questionnaire_assignments_player_id_status_idx" ON "questionnaire_assignments"("player_id", "status");

-- CreateIndex
CREATE INDEX "questionnaire_assignments_questionnaire_id_idx" ON "questionnaire_assignments"("questionnaire_id");

-- CreateIndex
CREATE UNIQUE INDEX "answers_assignment_id_question_id_key" ON "answers"("assignment_id", "question_id");

-- CreateIndex
CREATE INDEX "_TrainerPlayers_B_index" ON "_TrainerPlayers"("B");

-- AddForeignKey
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "questionnaire_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "questionnaire_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrainerPlayers" ADD CONSTRAINT "_TrainerPlayers_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrainerPlayers" ADD CONSTRAINT "_TrainerPlayers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
