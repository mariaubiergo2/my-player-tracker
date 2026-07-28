-- CreateTable
CREATE TABLE "match_feedback_messages" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_feedback_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "match_feedback_messages" ADD CONSTRAINT "match_feedback_messages_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_feedback_messages" ADD CONSTRAINT "match_feedback_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
