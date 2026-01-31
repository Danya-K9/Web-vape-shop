-- AlterTable
ALTER TABLE "User" ADD COLUMN "telegramChatId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");
