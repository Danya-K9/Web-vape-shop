-- AlterTable: OrderItem - productId nullable + productTitle/productImageUrl для истории при удалении товара
ALTER TABLE "OrderItem" ADD COLUMN "productTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "OrderItem" ADD COLUMN "productImageUrl" TEXT;

-- Backfill productTitle и productImageUrl из Product для существующих строк
UPDATE "OrderItem" SET 
  "productTitle" = COALESCE((SELECT "title" FROM "Product" WHERE "Product"."id" = "OrderItem"."productId"), ''),
  "productImageUrl" = (SELECT "imageUrl" FROM "Product" WHERE "Product"."id" = "OrderItem"."productId")
WHERE "productId" IS NOT NULL;

-- Делаем productId nullable и добавляем ON DELETE SET NULL
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;

-- Пересоздаём FK с ON DELETE SET NULL
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
