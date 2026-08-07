-- CreateTable
CREATE TABLE "player_objectives" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "items" TEXT[],
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_objectives_player_id_effective_from_idx" ON "player_objectives"("player_id", "effective_from");

-- CreateIndex
CREATE INDEX "player_objectives_player_id_effective_to_idx" ON "player_objectives"("player_id", "effective_to");

-- AddForeignKey
ALTER TABLE "player_objectives" ADD CONSTRAINT "player_objectives_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_objectives" ADD CONSTRAINT "player_objectives_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
