-- Additive only: keeps all existing orders, products, sessions and ads settings.
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "beforeStock" INTEGER NOT NULL,
    "afterStock" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StockAdjustment_createdAt_idx" ON "StockAdjustment"("createdAt");
CREATE INDEX "StockAdjustment_productId_createdAt_idx" ON "StockAdjustment"("productId","createdAt");
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_productId_fkey"
 FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_adminId_fkey"
 FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
