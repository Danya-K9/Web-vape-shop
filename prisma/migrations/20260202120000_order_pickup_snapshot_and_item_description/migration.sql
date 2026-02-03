-- Order: снимок точки самовывоза + pickupLocationId nullable (ON DELETE SET NULL)
ALTER TABLE "Order" ADD COLUMN "pickupLocationName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "pickupLocationAddress" TEXT;

UPDATE "Order" SET
  "pickupLocationName" = COALESCE((SELECT "name" FROM "PickupLocation" WHERE "PickupLocation"."id" = "Order"."pickupLocationId"), ''),
  "pickupLocationAddress" = (SELECT "address" FROM "PickupLocation" WHERE "PickupLocation"."id" = "Order"."pickupLocationId")
WHERE "pickupLocationId" IS NOT NULL;

ALTER TABLE "Order" ALTER COLUMN "pickupLocationId" DROP NOT NULL;

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_pickupLocationId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_pickupLocationId_fkey"
  FOREIGN KEY ("pickupLocationId") REFERENCES "PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- OrderItem: снимок описания товара (история не меняется при редактировании)
ALTER TABLE "OrderItem" ADD COLUMN "productDescription" TEXT;

UPDATE "OrderItem" SET "productDescription" = (SELECT "description" FROM "Product" WHERE "Product"."id" = "OrderItem"."productId")
WHERE "productId" IS NOT NULL;
