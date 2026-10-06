CREATE TABLE IF NOT EXISTS "ProductImage" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductImage_productId_sortOrder_idx"
ON "ProductImage"("productId", "sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProductImage_productId_fkey'
  ) THEN
    ALTER TABLE "ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey"
    FOREIGN KEY ("productId")
    REFERENCES "Product"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;
