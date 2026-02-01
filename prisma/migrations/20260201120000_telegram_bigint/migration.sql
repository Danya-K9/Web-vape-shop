-- AlterTable: Telegram IDs могут превышать INT4 (2^31-1), меняем на BIGINT
ALTER TABLE "User" ALTER COLUMN "telegramChatId" TYPE BIGINT USING "telegramChatId"::BIGINT;

ALTER TABLE "Order" ALTER COLUMN "telegramChatId" TYPE BIGINT USING "telegramChatId"::BIGINT;
ALTER TABLE "Order" ALTER COLUMN "telegramMessageId" TYPE BIGINT USING "telegramMessageId"::BIGINT;
